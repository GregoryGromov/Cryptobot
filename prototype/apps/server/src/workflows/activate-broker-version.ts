import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import { availableModels } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import type { Deps } from './deps.js';

export const activationInputSchema = z.strictObject({
  requestId: idSchema,
  versionId: idSchema,
  baseVersionId: idSchema,
});
export async function activateBrokerVersion(deps: Deps, userId: string, raw: unknown) {
  const input = activationInputSchema.parse(raw);
  return inTransaction(deps.db, async (tx) => {
    const personal = await broker.findBroker(tx, userId);
    const version = await broker.findVersion(tx, input.versionId);
    if (!personal || version?.brokerId !== personal.id)
      return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'broker', personal.id);
    const inputHash = payloadHash(input);
    const prior = await broker.findActivationRequest(tx, personal.id, input.requestId);
    if (prior)
      return prior.inputHash === inputHash
        ? ({ kind: 'activated', activation: prior, replayed: true } as const)
        : ({ kind: 'rejected', reason: 'request-conflict' } as const);
    const head = await broker.loadHead(tx, personal.id);
    if (head.versionId !== input.baseVersionId)
      return { kind: 'rejected', reason: 'version-conflict' } as const;
    if (!availableModels(deps.config).includes(version.model) || version.route !== 'platform')
      return { kind: 'rejected', reason: 'model-unavailable' } as const;
    const activation: broker.Activation = {
      id: newId(),
      brokerId: personal.id,
      versionId: version.id,
      requestId: input.requestId,
      inputHash,
      createdAt: deps.clock.now(),
    };
    await broker.recordActivation(tx, activation);
    const chat = await conversation.ensureConversation(tx, userId, personal.id, 'broker');
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: chat.id,
      kind: 'broker-activation',
      sourceId: activation.id,
      body: { versionId: version.id, number: version.number },
      createdAt: activation.createdAt,
    });
    return { kind: 'activated', activation, replayed: false } as const;
  });
}
