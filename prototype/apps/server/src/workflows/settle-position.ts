import type { CandleSlot } from '@reinforce/harness-contract';
import { D, usd } from '../kernel/money.js';
import { MINUTE, minuteFloor } from '../kernel/time.js';
import * as conversation from '../modules/conversation/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

export async function settlePosition(deps: Deps, orderId: string) {
  return inTransaction(deps.db, (tx) =>
    settlePositionInTransaction(deps, tx, orderId, deps.clock.now(), true),
  );
}

export async function settlePositionInTransaction(
  deps: Deps,
  tx: Tx,
  orderId: string,
  now: number,
  schedule: boolean,
) {
  const order = await trading.findOrder(tx, orderId);
  if (!order) throw new Error('Order missing');
  await lock(tx, 'trading-account', order.accountId);
  const executions = await trading.listExecutions(tx, order.id);
  if (executions.some((e) => e.kind === 'exit' || e.kind === 'rejected'))
    return { kind: 'recorded' } as const;
  const entryFact = executions.find((e) => e.kind === 'entry');
  if (!entryFact) throw new Error('Entry missing');
  const entry = trading.openFillSchema.parse(entryFact.body);
  const head = await trading.loadHead(tx, order.accountId);
  const account = await trading.findAccountById(tx, order.accountId);
  if (!account || head.currentOrderId !== order.id) throw new Error('Position reservation mismatch');
  const until = Math.min(minuteFloor(now), order.entryAt + order.terms.horizon * MINUTE);
  const candles = await market.loadCandles(tx, order.terms.instrument, order.entryAt, until);
  const byMinute = new Map(candles.map((row) => [row.candle.openAt, row]));
  const slots: CandleSlot[] = [];
  for (let at = order.entryAt; at < until; at += MINUTE) {
    const row = byMinute.get(at);
    slots.push(
      row
        ? { kind: 'closed', candle: row.candle }
        : { kind: 'missing', instrument: order.terms.instrument, openAt: at },
    );
  }
  const result = trading.closePosition(order.terms, entry, slots, head.capital);
  if (result.kind !== 'closed') {
    if (schedule) await enqueue(deps.jobs, tx, 'position.settle', order.id, now + 15000);
    return result;
  }
  const execution = {
    id: newId(),
    orderId: order.id,
    kind: 'exit' as const,
    body: {
      ...result.fill,
      candleIds: candles.filter((row) => row.candle.openAt <= result.fill.at).map((row) => row.id),
    },
    createdAt: now,
  };
  await trading.recordExecution(tx, execution);
  const capital = usd(new D(head.capital).plus(result.fill.pnl));
  if (new D(capital).lte(0)) await trading.resetBankruptCycle(tx, account.id, capital, result.fill.at);
  else await trading.updateHead(tx, account.id, { capital, currentOrderId: null, asOf: result.fill.at });
  const chat = await conversation.ensureConversation(
    tx,
    account.userId,
    account.brokerId,
    order.terms.instrument,
  );
  await conversation.appendEntry(tx, {
    id: newId(),
    conversationId: chat.id,
    kind: 'trade-closed',
    sourceId: execution.id,
    body: { orderId, account: account.kind, ...execution.body },
    createdAt: now,
  });
  return result;
}
