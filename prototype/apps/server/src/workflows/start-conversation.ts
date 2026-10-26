import { idSchema, messageTextSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import { inTransaction, lock } from '../platform/db.js';
import type { Deps } from './deps.js';
import { sendMessageInTransaction } from './send-message.js';

export const startConversationSchema = z.strictObject({
  requestId: idSchema,
  text: messageTextSchema,
});

/** The first message, conversation and response job commit together. Retries reuse the topic. */
export async function startConversation(deps: Deps, userId: string, raw: unknown) {
  const input = startConversationSchema.parse(raw);
  return inTransaction(deps.db, async (tx) => {
    const owner = await broker.findBroker(tx, userId);
    if (!owner) return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'broker', owner.id);
    const chat = await conversation.ensureConversation(tx, userId, owner.id, `talk-${input.requestId}`);
    const result = await sendMessageInTransaction(deps, tx, userId, {
      ...input,
      conversationId: chat.id,
      reviseProposalVersionId: null,
    });
    return result.kind === 'sent' ? { ...result, chat: chat.topic } : result;
  });
}
