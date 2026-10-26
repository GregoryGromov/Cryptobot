import type { versionInputSchema } from '@reinforce/harness-contract';
import type { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import { availableModels } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import type { Deps } from './deps.js';

export async function changeBrokerVersion(
  deps: Deps,
  userId: string,
  input: z.infer<typeof versionInputSchema>,
) {
  return inTransaction(deps.db, async (tx) => {
    const personal = await broker.findBroker(tx, userId);
    if (!personal) return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'broker', personal.id);
    const inputHash = payloadHash(input);
    const prior = await broker.findVersionRequest(tx, personal.id, input.requestId);
    if (prior)
      return prior.inputHash === inputHash
        ? ({ kind: 'saved', version: prior, replayed: true } as const)
        : ({ kind: 'rejected', reason: 'request-conflict' } as const);
    if (await broker.findActivationRequest(tx, personal.id, input.requestId))
      return { kind: 'rejected', reason: 'request-conflict' } as const;
    const head = await broker.loadHead(tx, personal.id);
    if (head.versionId !== input.baseVersionId)
      return { kind: 'rejected', reason: 'version-conflict' } as const;
    if (!availableModels(deps.config).includes(input.model))
      return { kind: 'rejected', reason: 'model-unavailable' } as const;
    const now = deps.clock.now();
    const version: broker.BrokerVersion = {
      id: newId(),
      brokerId: personal.id,
      number: head.nextVersion,
      prompt: input.prompt,
      model: input.model,
      route: 'platform',
      harness: 'builtin-1',
      note: input.note,
      requestId: input.requestId,
      inputHash,
      createdAt: now,
    };
    await broker.recordVersion(tx, version, newId());
    const chat = await conversation.ensureConversation(tx, userId, personal.id, 'broker');
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: chat.id,
      kind: 'broker-version',
      sourceId: version.id,
      body: { versionId: version.id, number: version.number, note: version.note },
      createdAt: now,
    });
    return { kind: 'saved', version, replayed: false } as const;
  });
}
