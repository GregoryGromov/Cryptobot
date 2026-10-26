import type { CandleSlot } from '@reinforce/harness-contract';
import type { Locale } from '@reinforce/i18n/server';
import { z } from 'zod';
import { D } from '../../kernel/money.js';
import { MINUTE, minuteFloor } from '../../kernel/time.js';
import * as forecast from '../../modules/forecast/index.js';
import * as market from '../../modules/market/index.js';
import * as trading from '../../modules/trading/index.js';
import { type Db, inReadSnapshot } from '../../platform/db.js';
import type { Deps } from '../../workflows/deps.js';
import type { Book, BookCycle, TradeRow, Trades } from '../view-types.js';
import { marketName } from './market.js';

const fillSchema = z.object({
  at: z.number(),
  referencePrice: z.string(),
  price: z.string(),
  fee: z.string(),
});
const exitSchema = fillSchema.extend({
  pnl: z.string(),
  ambiguous: z.boolean(),
  reason: z.enum(['stop-loss', 'take-profit', 'time', 'bankruptcy']),
});
const rejectionSchema = z.object({ reason: z.enum(['capital', 'wrong-instrument', 'invalid-levels']) });
const asFill = (raw: z.infer<typeof fillSchema>) => ({
  at: raw.at,
  refPrice: Number(raw.referencePrice),
  price: Number(raw.price),
  fee: Number(raw.fee),
});
type ReadContext = { db: Db; now: number; locale: Locale };

export const emptyBook = (book: 'user' | 'agent'): Book => ({
  book,
  currentCycleId: null,
  cycles: [],
  startNav: 10000,
  capital: 10000,
  nav: 10000,
  asOf: null,
  realized: 0,
  unrealized: 0,
  fees: 0,
  returnPct: 0,
  maxDrawdownPct: 0,
  closedCount: 0,
  wins: 0,
  openCount: 0,
});

async function readTrade(ctx: ReadContext, order: trading.Order, kind: 'user' | 'broker'): Promise<TradeRow> {
  const { db, now, locale } = ctx;
  const fills = await trading.listExecutions(db, order.id);
  const terms = order.terms;
  const proposalVersion =
    order.sourceKind === 'proposal' ? await trading.findProposalVersion(db, order.sourceId) : undefined;
  const proposal = proposalVersion ? await trading.findProposal(db, proposalVersion.proposalId) : undefined;
  const forecastId = order.sourceKind === 'forecast' ? order.sourceId : proposal?.forecastId;
  const sourceForecast = forecastId ? await forecast.findForecast(db, forecastId) : undefined;
  const base = {
    id: order.id,
    cycleId: order.cycleId,
    book: kind === 'user' ? ('user' as const) : ('agent' as const),
    coin: terms.instrument,
    name: marketName(terms.instrument, locale).name,
    side: terms.side,
    horizon: terms.horizon,
    stopLossPct: terms.stopPct,
    takeProfitPct: terms.targetPct,
    entryAt: order.entryAt,
    exitDeadline: order.entryAt + terms.horizon * MINUTE,
    source:
      order.sourceKind === 'proposal'
        ? ('proposal' as const)
        : order.sourceKind === 'manual'
          ? ('manual' as const)
          : ('plan' as const),
    note: '',
    requested: Number(terms.amount),
    requestedPct: null,
    threadId: sourceForecast?.dispatchId ?? null,
  };
  const rejected = fills.find((fill) => fill.kind === 'rejected');
  if (rejected) return { ...base, status: 'rejected', reason: rejectionSchema.parse(rejected.body).reason };
  const entryFact = fills.find((fill) => fill.kind === 'entry');
  if (!entryFact) {
    const waitingFor =
      now < order.entryAt
        ? 'time'
        : (await market.findCandle(db, terms.instrument, order.entryAt - MINUTE))
          ? 'execution'
          : 'prices';
    return { ...base, status: 'pending', waitingFor };
  }
  const entry = trading.openFillSchema.parse(entryFact.body);
  const entered = {
    entry: asFill(entry),
    notional: Number(entry.amount),
    qty: Number(entry.quantity),
    stopPrice: Number(entry.stop),
    takePrice: Number(entry.target),
  };
  const exitFact = fills.find((fill) => fill.kind === 'exit');
  if (exitFact) {
    const exit = exitSchema.parse(exitFact.body);
    return {
      ...base,
      ...entered,
      status: 'closed',
      exit: { ...asFill(exit), reason: exit.reason },
      pnl: Number(exit.pnl),
      ambiguous: exit.ambiguous,
      dataGap: false,
    };
  }
  // A latest quote alone cannot prove this position is still open: an earlier candle may have hit its stop.
  const head = await trading.loadHead(db, order.accountId);
  const until = Math.min(minuteFloor(now), base.exitDeadline);
  const candles = await market.loadCandles(db, terms.instrument, order.entryAt, until);
  const byMinute = new Map(candles.map((row) => [row.candle.openAt, row.candle]));
  const slots: CandleSlot[] = [];
  for (let at = order.entryAt; at < until; at += MINUTE) {
    const candle = byMinute.get(at);
    slots.push(
      candle ? { kind: 'closed', candle } : { kind: 'missing', instrument: terms.instrument, openAt: at },
    );
  }
  const value = trading.closePosition(terms, entry, slots, head.capital);
  return value.kind === 'open'
    ? {
        ...base,
        ...entered,
        status: 'open',
        valuation: 'priced',
        mark: Number(value.mark),
        markAt: value.asOf,
        unrealized: Number(value.unrealized),
      }
    : {
        ...base,
        ...entered,
        status: 'open',
        valuation: value.kind === 'unresolved' ? 'awaiting-prices' : 'awaiting-settlement',
        mark: null,
        markAt: null,
        unrealized: null,
      };
}

export function tradeRow(
  deps: Deps,
  order: trading.Order,
  kind: 'user' | 'broker',
  locale: Locale,
): Promise<TradeRow> {
  const now = deps.clock.now();
  return inReadSnapshot(deps.db, (db) => readTrade({ db, now, locale }, order, kind));
}

async function accountView(
  ctx: ReadContext,
  userId: string,
  kind: 'user' | 'broker',
): Promise<Book & { rows: TradeRow[] }> {
  const { db, now } = ctx;
  const book = kind === 'user' ? 'user' : 'agent';
  const account = await trading.findAccount(db, userId, kind);
  if (!account) throw new Error('Account missing');
  const head = await trading.loadHead(db, account.id);
  const orders = await trading.listOrders(db, account.id);
  const rows: TradeRow[] = [];
  for (const order of orders) rows.push(await readTrade(ctx, order, kind));
  const facts = (await trading.listCycles(db, account.id)).sort((a, b) => a.number - b.number);
  const cycles: BookCycle[] = facts.map((cycle, i) => {
    const own = rows.filter((row) => row.cycleId === cycle.id);
    const closed = own.filter((row) => row.status === 'closed').sort((a, b) => a.exit.at - b.exit.at);
    let capital = new D(cycle.startCapital);
    let peak = capital;
    let drawdown = 0;
    for (const row of closed) {
      capital = capital.plus(row.pnl);
      peak = D.max(peak, capital);
      drawdown = Math.max(drawdown, peak.minus(capital).div(peak).mul(100).toNumber());
    }
    return {
      id: cycle.id,
      number: cycle.number,
      startedAt: cycle.createdAt,
      endedAt: facts[i + 1]?.createdAt ?? null,
      startNav: Number(cycle.startCapital),
      endNav: facts[i + 1] ? capital.toNumber() : null,
      previousEndNav: cycle.number > 1 ? Number(cycle.previousLoss) : null,
      realized: capital.minus(cycle.startCapital).toNumber(),
      fees: own.reduce(
        (sum, row) =>
          sum +
          (row.status === 'closed'
            ? row.entry.fee + row.exit.fee
            : row.status === 'open'
              ? row.entry.fee
              : 0),
        0,
      ),
      maxDrawdownPct: drawdown,
      closedCount: closed.length,
      wins: closed.filter((row) => row.pnl > 0).length,
    };
  });
  const current = cycles.find((cycle) => cycle.id === head.cycleId);
  if (!current) throw new Error('Current cycle missing');
  const currentRows = rows.filter((row) => row.cycleId === current.id);
  const open = currentRows.filter((row) => row.status === 'open');
  const unrealized = open.some((row) => row.unrealized === null)
    ? null
    : open.reduce((sum, row) => sum.plus(row.unrealized ?? 0), new D(0)).toNumber();
  const nav = unrealized === null ? null : new D(head.capital).plus(unrealized).toNumber();
  return {
    ...emptyBook(book),
    rows,
    currentCycleId: current.id,
    cycles,
    startNav: current.startNav,
    capital: Number(head.capital),
    nav,
    asOf: nav === null ? null : open.length ? Math.min(...open.map((row) => row.markAt!)) : now,
    realized: current.realized,
    unrealized,
    returnPct: nav === null ? null : (nav / current.startNav - 1) * 100,
    fees: current.fees,
    maxDrawdownPct: current.maxDrawdownPct,
    closedCount: current.closedCount,
    wins: current.wins,
    openCount: currentRows.filter((row) => row.status === 'open' || row.status === 'pending').length,
  };
}

export async function portfolioView(deps: Deps, userId: string | undefined, locale: Locale): Promise<Trades> {
  if (!userId)
    return { user: { ...emptyBook('user'), rows: [] }, agent: { ...emptyBook('agent'), rows: [] } };
  const now = deps.clock.now();
  return inReadSnapshot(deps.db, async (db) => {
    const ctx = { db, now, locale };
    const user = await accountView(ctx, userId, 'user');
    const agent = await accountView(ctx, userId, 'broker');
    return { user, agent };
  });
}
