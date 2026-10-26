import type { BookCycle, TradeRow, Trades } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { type EquityPoint, equitySeries, returnPctOf } from './equity';

export type BookKey = Trades['user']['book'];
type BookRows = Trades['user'];

type BookValue =
  | {
      readonly kind: 'valued';
      readonly nav: number;
      readonly returnPct: number | null;
      readonly asOf: number | null;
    }
  | { readonly kind: 'awaiting' };

type BookPeriod =
  | { readonly kind: 'current'; readonly unrealized: number | null; readonly capital: number }
  | { readonly kind: 'ended'; readonly cycle: BookCycle };

export type BookView = {
  readonly key: BookKey;
  readonly cycle: BookCycle | null;
  readonly cycles: readonly BookCycle[];
  readonly value: BookValue;
  readonly period: BookPeriod;
  readonly realized: number;
  readonly fees: number;
  readonly maxDrawdownPct: number;
  readonly closedCount: number;
  readonly wins: number;
  readonly active: readonly TradeRow[];
  readonly done: readonly TradeRow[];
  readonly equity: readonly EquityPoint[];
  readonly until: number;
};

const selectedCycle = (book: BookRows, cycleId: string | undefined): BookCycle | null =>
  book.cycles.find((cycle) => cycle.id === cycleId) ??
  book.cycles.find((cycle) => cycle.id === book.currentCycleId) ??
  null;

export const rowAt = (row: TradeRow): number =>
  match(row)
    .with({ status: 'closed' }, (r) => r.exit.at)
    .with({ status: 'pending' }, { status: 'open' }, { status: 'rejected' }, (r) => r.entryAt)
    .exhaustive();

const isActive = (row: TradeRow): boolean => row.status === 'pending' || row.status === 'open';

const latestFirst = (rows: readonly TradeRow[]): readonly TradeRow[] =>
  [...rows].sort((a, b) => rowAt(b) - rowAt(a));

const closesOf = (rows: readonly TradeRow[]) =>
  rows.flatMap((row) => (row.status === 'closed' ? [{ at: row.exit.at, pnl: row.pnl }] : []));

const currentView = (book: BookRows, cycle: BookCycle | null, rows: readonly TradeRow[], now: number) => {
  const value: BookValue =
    book.nav === null
      ? { kind: 'awaiting' }
      : { kind: 'valued', nav: book.nav, returnPct: book.returnPct, asOf: book.asOf };
  const end = book.nav !== null && book.asOf !== null ? { at: book.asOf, nav: book.nav } : null;
  return {
    value,
    period: { kind: 'current', unrealized: book.unrealized, capital: book.capital } satisfies BookPeriod,
    realized: book.realized,
    fees: book.fees,
    maxDrawdownPct: book.maxDrawdownPct,
    closedCount: book.closedCount,
    wins: book.wins,
    equity:
      cycle === null
        ? []
        : equitySeries({ start: { at: cycle.startedAt, nav: cycle.startNav }, closes: closesOf(rows), end }),
    until: now,
  };
};

const endedView = (cycle: BookCycle, endedAt: number, rows: readonly TradeRow[]) => {
  const value: BookValue =
    cycle.endNav === null
      ? { kind: 'awaiting' }
      : {
          kind: 'valued',
          nav: cycle.endNav,
          returnPct: returnPctOf(cycle.startNav, cycle.endNav),
          asOf: endedAt,
        };
  const end = cycle.endNav === null ? null : { at: endedAt, nav: cycle.endNav };
  return {
    value,
    period: { kind: 'ended', cycle } satisfies BookPeriod,
    realized: cycle.realized,
    fees: cycle.fees,
    maxDrawdownPct: cycle.maxDrawdownPct,
    closedCount: cycle.closedCount,
    wins: cycle.wins,
    equity: equitySeries({
      start: { at: cycle.startedAt, nav: cycle.startNav },
      closes: closesOf(rows),
      end,
    }),
    until: endedAt,
  };
};

export const bookView = (book: BookRows, cycleId: string | undefined, now: number): BookView => {
  const cycle = selectedCycle(book, cycleId);
  const rows = cycle === null ? book.rows : book.rows.filter((row) => row.cycleId === cycle.id);
  const endedAt = cycle?.id === book.currentCycleId ? null : (cycle?.endedAt ?? null);
  const figures =
    cycle !== null && endedAt !== null
      ? endedView(cycle, endedAt, rows)
      : currentView(book, cycle, rows, now);
  return {
    key: book.book,
    cycle,
    cycles: [...book.cycles].sort((a, b) => b.number - a.number),
    ...figures,
    active: latestFirst(rows.filter(isActive)),
    done: latestFirst(rows.filter((row) => !isActive(row))),
  };
};

export const findTrade = (trades: Trades, tradeId: string): TradeRow | null =>
  [...trades.user.rows, ...trades.agent.rows].find((row) => row.id === tradeId) ?? null;
