import { bigint, integer, jsonb, pgSchema, primaryKey, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const conversation = pgSchema('conversation');
export const responseLeases = conversation.table('response_leases', {
  conversationId: uuid('conversation_id').primaryKey(),
  token: uuid().notNull(),
  leaseUntil: bigint('lease_until', { mode: 'number' }).notNull(),
});
/** What the model has written so far of the answer being made in a conversation; see migration 0017. */
export const responseDrafts = conversation.table('response_drafts', {
  conversationId: uuid('conversation_id').primaryKey(),
  runId: uuid('run_id').notNull(),
  sourceId: uuid('source_id').notNull(),
  text: text().notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
export const telegramCursors = conversation.table(
  'telegram_cursors',
  {
    linkId: uuid('link_id').notNull(),
    conversationId: uuid('conversation_id').notNull(),
    seq: bigint({ mode: 'number' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.linkId, t.conversationId] })],
);
export const telegramDeliveries = conversation.table(
  'telegram_deliveries',
  {
    id: uuid().primaryKey(),
    linkId: uuid('link_id').notNull(),
    sourceId: text('source_id').notNull(),
    conversationId: uuid('conversation_id'),
    entryId: uuid('entry_id'),
    payload: jsonb().$type<Record<string, unknown>>(),
    status: text().$type<'pending' | 'sending' | 'sent' | 'skipped' | 'failed' | 'unknown'>().notNull(),
    attempts: integer().notNull().default(0),
    notBefore: bigint('not_before', { mode: 'number' }).notNull().default(0),
    attemptId: uuid('attempt_id'),
    leaseUntil: bigint('lease_until', { mode: 'number' }),
    messageId: bigint('message_id', { mode: 'number' }),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('telegram_delivery_source').on(t.linkId, t.sourceId)],
);
export const conversations = conversation.table(
  'conversations',
  {
    id: uuid().primaryKey(),
    userId: uuid('user_id').notNull(),
    brokerId: uuid('broker_id').notNull(),
    topic: text().notNull(),
    nextSeq: bigint('next_seq', { mode: 'number' }).notNull(),
    readSeq: bigint('read_seq', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('conversation_topic').on(t.brokerId, t.topic)],
);
export const entries = conversation.table(
  'entries',
  {
    id: uuid().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id),
    seq: bigint({ mode: 'number' }).notNull(),
    kind: text().notNull(),
    sourceId: text('source_id').notNull(),
    body: jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [
    uniqueIndex('conversation_seq').on(t.conversationId, t.seq),
    uniqueIndex('conversation_source').on(t.conversationId, t.kind, t.sourceId),
  ],
);
