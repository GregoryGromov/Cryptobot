import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { D } from '../kernel/money.js';
import { nextMinute } from '../kernel/time.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

const inputSchema = z.strictObject({ versionId: idSchema, decision: z.enum(['confirmed', 'declined']) });
export async function confirmProposal(deps: Deps, userId: string, raw: unknown) {
  const input = inputSchema.parse(raw);
  return inTransaction(deps.db, (tx) => confirmProposalInTransaction(deps, tx, userId, input));
}

export async function confirmProposalInTransaction(
  deps: Deps,
  tx: Tx,
  userId: string,
  input: z.infer<typeof inputSchema>,
) {
  const personal = await broker.findBroker(tx, userId);
  const userAccount = await trading.findAccount(tx, userId, 'user');
  const version = await trading.findProposalVersion(tx, input.versionId);
  const proposal = version ? await trading.findProposal(tx, version.proposalId) : undefined;
  if (!personal || !userAccount || !version || proposal?.brokerId !== personal.id)
    return { kind: 'rejected', reason: 'not-found' } as const;
  // Global order: account -> proposal -> conversation. No network inside this transaction.
  await lock(tx, 'trading-account', userAccount.id);
  await lock(tx, 'proposal', proposal.id);
  const decision = await trading.findDecision(tx, proposal.id);
  if (decision) {
    if (decision.versionId !== input.versionId || decision.decision !== input.decision)
      return { kind: 'rejected', reason: 'already-decided' } as const;
    const order = await trading.findSourceOrder(tx, userAccount.id, 'proposal', version.id);
    return { kind: 'decided', decision, order: order ?? null, replayed: true } as const;
  }
  const latest = await trading.latestProposalVersion(tx, proposal.id);
  if (latest?.id !== version.id) return { kind: 'rejected', reason: 'superseded' } as const;
  const now = deps.clock.now();
  if (now >= version.validUntil) return { kind: 'rejected', reason: 'expired' } as const;
  const head = await trading.loadHead(tx, userAccount.id);
  const preferences = (await broker.loadHead(tx, personal.id)).preferences;
  const rules = trading.rulesFor('lower'); // Conservative until the instrument supplies a calibrated bucket.
  if (input.decision === 'confirmed') {
    if (head.currentOrderId) return { kind: 'rejected', reason: 'account-busy' } as const;
    const total = new D(version.terms.amount).mul(new D(1).plus(rules.feeRate));
    if (total.gt(head.capital) || new D(version.terms.amount).gt(preferences.maxTradeUsd))
      return { kind: 'rejected', reason: 'capital' } as const;
  }
  const recorded = {
    id: newId(),
    proposalId: proposal.id,
    versionId: version.id,
    userId,
    decision: input.decision,
    createdAt: now,
  };
  await trading.recordDecision(tx, recorded);
  let order: trading.Order | null = null;
  if (input.decision === 'confirmed') {
    order = {
      id: newId(),
      accountId: userAccount.id,
      cycleId: head.cycleId,
      sourceKind: 'proposal',
      sourceId: version.id,
      versionId: proposal.versionId,
      terms: version.terms,
      entryAt: nextMinute(now),
      rules,
      createdAt: now,
    };
    await trading.recordOrder(tx, order);
    await enqueue(deps.jobs, tx, 'trade.execute', order.id, order.entryAt);
  }
  await conversation.appendEntry(tx, {
    id: newId(),
    conversationId: proposal.conversationId,
    kind: 'proposal-decision',
    sourceId: recorded.id,
    body: {
      proposalId: proposal.id,
      versionId: version.id,
      decision: input.decision,
      orderId: order?.id ?? null,
    },
    createdAt: now,
  });
  return { kind: 'decided', decision: recorded, order, replayed: false } as const;
}
