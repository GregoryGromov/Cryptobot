import { MINUTE } from '../kernel/time.js';
import * as conversation from '../modules/conversation/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

export async function executeOrder(deps: Deps, orderId: string) {
  return inTransaction(deps.db, (tx) => executeOrderInTransaction(deps, tx, orderId, deps.clock.now(), true));
}

export async function executeOrderInTransaction(
  deps: Deps,
  tx: Tx,
  orderId: string,
  now: number,
  schedule: boolean,
) {
  const order = await trading.findOrder(tx, orderId);
  if (!order) throw new Error('Order missing');
  await lock(tx, 'trading-account', order.accountId);
  const prior = await trading.listExecutions(tx, order.id);
  if (prior.length) return { kind: 'recorded', execution: prior[0] } as const;
  if (now < order.entryAt) {
    if (schedule) await enqueue(deps.jobs, tx, 'trade.execute', orderId, order.entryAt);
    return { kind: 'waiting' } as const;
  }
  const anchor = await market.findCandle(tx, order.terms.instrument, order.entryAt - MINUTE);
  if (!anchor) {
    if (schedule) await enqueue(deps.jobs, tx, 'trade.execute', orderId, now + 15000);
    return { kind: 'unresolved' } as const;
  }
  const account = await trading.findAccountById(tx, order.accountId);
  const head = await trading.loadHead(tx, order.accountId);
  if (!account || head.currentOrderId !== order.id || head.cycleId !== order.cycleId)
    throw new Error('Order reservation mismatch');
  const result = trading.openPosition(order.terms, anchor.candle, head.capital, order.rules);
  const execution = {
    id: newId(),
    orderId: order.id,
    kind: result.kind === 'opened' ? ('entry' as const) : ('rejected' as const),
    body:
      result.kind === 'opened'
        ? { ...result.fill, referenceCandleId: anchor.id }
        : { reason: result.reason, referenceCandleId: anchor.id },
    createdAt: now,
  };
  await trading.recordExecution(tx, execution);
  if (result.kind === 'rejected')
    await trading.updateHead(tx, account.id, { currentOrderId: null, asOf: order.entryAt });
  else {
    await trading.updateHead(tx, account.id, { asOf: order.entryAt });
    if (schedule) await enqueue(deps.jobs, tx, 'position.settle', order.id, order.entryAt + MINUTE);
  }
  const chat = await conversation.ensureConversation(
    tx,
    account.userId,
    account.brokerId,
    order.terms.instrument,
  );
  await conversation.appendEntry(tx, {
    id: newId(),
    conversationId: chat.id,
    kind: result.kind === 'opened' ? 'trade-opened' : 'trade-rejected',
    sourceId: execution.id,
    body: { orderId, account: account.kind, ...execution.body },
    createdAt: now,
  });
  return result;
}
