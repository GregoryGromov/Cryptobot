import { idSchema, messageTextSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { usesHttpMarket } from '../platform/config.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

const DAY = 86_400_000;
/** A stretch of the market's chart the person picked to ask about. */
export const spanSchema = z
  .strictObject({ from: z.number().int().nonnegative(), to: z.number().int().positive() })
  .refine((span) => span.from < span.to && span.to - span.from <= 400 * DAY);

/** The clock the person reads times by on their screen; the broker names times in it. */
export const timeZoneSchema = z
  .string()
  .max(100)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  });

export const messageInputSchema = z.strictObject({
  topic: z.string().min(1).max(100),
  requestId: idSchema,
  text: messageTextSchema,
  reviseProposalVersionId: idSchema.nullable(),
  span: spanSchema.nullish(),
  timeZone: timeZoneSchema.nullish(),
});
export type MessageInput = z.infer<typeof messageInputSchema>;

/** A talk must already exist; a market must be one the platform knows; the broker's own topic always is. */
export async function sendMessage(deps: Deps, userId: string, input: MessageInput) {
  if (
    !conversation.isGeneral(input.topic) &&
    !(await market.knownInstrument(deps.db, input.topic, usesHttpMarket(deps.config)))
  )
    return { kind: 'rejected', reason: 'not-found' } as const;
  return inTransaction(deps.db, async (tx) => {
    const owner = await broker.findBroker(tx, userId);
    if (!owner) return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'broker', owner.id);
    const chat = conversation.isTalk(input.topic)
      ? await conversation.findTopic(tx, userId, input.topic)
      : await conversation.ensureConversation(tx, userId, owner.id, input.topic);
    if (!chat) return { kind: 'rejected', reason: 'not-found' } as const;
    const result = await sendMessageInTransaction(deps, tx, userId, { ...input, conversationId: chat.id });
    return result.kind === 'sent' ? { ...result, chat: chat.topic } : result;
  });
}

export async function sendMessageInTransaction(
  deps: Deps,
  tx: Tx,
  userId: string,
  input: Omit<MessageInput, 'topic'> & { conversationId: string },
) {
  const chat = await conversation.findConversation(tx, input.conversationId, userId);
  if (!chat) return { kind: 'rejected', reason: 'not-found' } as const;
  await lock(tx, 'broker', chat.brokerId);
  await lock(tx, 'conversation', chat.id);
  const previous = await conversation.findSourceEntry(tx, chat.id, 'user-message', input.requestId);
  if (previous)
    return previous.body.text === input.text &&
      previous.body.reviseProposalVersionId === input.reviseProposalVersionId &&
      JSON.stringify(previous.body.span ?? null) === JSON.stringify(input.span ?? null)
      ? ({ kind: 'sent', entry: previous, replayed: true } as const)
      : ({ kind: 'rejected', reason: 'request-conflict' } as const);
  if (input.reviseProposalVersionId) {
    const version = await trading.findProposalVersion(tx, input.reviseProposalVersionId);
    const proposal = version ? await trading.findProposal(tx, version.proposalId) : undefined;
    if (proposal?.conversationId !== chat.id) return { kind: 'rejected', reason: 'not-found' } as const;
  }
  const head = await broker.loadHead(tx, chat.brokerId);
  const entry = await conversation.appendEntry(tx, {
    id: newId(),
    conversationId: chat.id,
    kind: 'user-message',
    sourceId: input.requestId,
    body: {
      text: input.text,
      versionId: head.versionId,
      reviseProposalVersionId: input.reviseProposalVersionId,
      ...(input.span ? { span: input.span } : {}),
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
    },
    createdAt: deps.clock.now(),
  });
  await enqueue(deps.jobs, tx, 'conversation.respond', entry.id);
  return { kind: 'sent', entry, replayed: false } as const;
}
