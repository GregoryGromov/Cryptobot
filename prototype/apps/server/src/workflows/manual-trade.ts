import { idSchema, proposalTermsSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { D } from '../kernel/money.js';
import { MINUTE, nextMinute } from '../kernel/time.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { usesHttpMarket } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';
import { refreshMarket } from './refresh-market.js';

export const manualTradeSchema = z.strictObject({ requestId: idSchema, terms: proposalTermsSchema });

/** The authenticated human submits the complete terms; a model has no route to this action. */
export async function manualTrade(deps: Deps, userId: string, raw: unknown) {
  const input = manualTradeSchema.parse(raw);
  if (usesHttpMarket(deps.config)) {
    const account = await trading.findAccount(deps.db, userId, 'user');
    // Any market on show can be traded, followed or not. An idempotent replay must not depend on the upstream.
    if (account && !(await trading.findSourceOrder(deps.db, account.id, 'manual', input.requestId)))
      await refreshMarket(deps, input.terms.instrument, 8000);
  }
  return inTransaction(deps.db, async (tx) => {
    const personal = await broker.findBroker(tx, userId);
    const account = await trading.findAccount(tx, userId, 'user');
    if (!personal || !account) return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'trading-account', account.id);
    const prior = await trading.findSourceOrder(tx, account.id, 'manual', input.requestId);
    if (prior)
      return payloadHash(prior.terms) === payloadHash(input.terms)
        ? ({ kind: 'ordered', order: prior, replayed: true } as const)
        : ({ kind: 'rejected', reason: 'request-conflict' } as const);
    const head = await trading.loadHead(tx, account.id);
    if (head.currentOrderId) return { kind: 'rejected', reason: 'account-busy' } as const;
    const config = await broker.loadHead(tx, personal.id);
    const rules = trading.rulesFor('lower');
    const amount = new D(input.terms.amount);
    if (
      amount.lt(1) ||
      amount.gt(config.preferences.maxTradeUsd) ||
      amount.mul(new D(1).plus(rules.feeRate)).gt(head.capital)
    )
      return { kind: 'rejected', reason: 'capital' } as const;
    const now = deps.clock.now();
    const snapshot = await market.currentSnapshot(
      tx,
      input.terms.instrument,
      now,
      deps.config.MARKET_MODE === 'live',
    );
    if (!snapshot)
      return {
        kind: 'rejected',
        reason: (await market.thinMarket(tx, input.terms.instrument)) ? 'market-thin' : 'market-unavailable',
      } as const;
    const reference = await market.findCandle(tx, input.terms.instrument, snapshot.cutoffAt - MINUTE);
    if (!reference) return { kind: 'rejected', reason: 'market-unavailable' } as const;
    const preview = trading.openPosition(input.terms, reference.candle, head.capital, rules);
    if (preview.kind === 'rejected') return { kind: 'rejected', reason: preview.reason } as const;
    const order: trading.Order = {
      id: newId(),
      accountId: account.id,
      cycleId: head.cycleId,
      sourceKind: 'manual',
      sourceId: input.requestId,
      versionId: config.versionId,
      terms: input.terms,
      entryAt: nextMinute(now),
      rules,
      createdAt: now,
    };
    await trading.recordOrder(tx, order);
    const chat = await conversation.ensureConversation(tx, userId, personal.id, input.terms.instrument);
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: chat.id,
      kind: 'manual-trade',
      sourceId: order.id,
      body: { orderId: order.id, terms: order.terms, entryAt: order.entryAt },
      createdAt: now,
    });
    await enqueue(deps.jobs, tx, 'trade.execute', order.id, order.entryAt);
    return { kind: 'ordered', order, replayed: false } as const;
  });
}
