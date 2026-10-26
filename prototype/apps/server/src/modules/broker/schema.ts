import type { Preferences } from '@reinforce/harness-contract';
import { bigint, integer, jsonb, pgSchema, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const broker = pgSchema('broker');
export const brokers = broker.table('brokers', {
  id: uuid().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  template: text().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const versions = broker.table(
  'versions',
  {
    id: uuid().primaryKey(),
    brokerId: uuid('broker_id')
      .notNull()
      .references(() => brokers.id),
    number: integer().notNull(),
    prompt: text().notNull(),
    model: text().notNull(),
    route: text().notNull(),
    harness: text().notNull(),
    note: text().notNull(),
    requestId: uuid('request_id').notNull(),
    inputHash: text('input_hash').notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [
    uniqueIndex('broker_version_number').on(t.brokerId, t.number),
    uniqueIndex('broker_version_request').on(t.brokerId, t.requestId),
  ],
);
export const activations = broker.table(
  'activations',
  {
    id: uuid().primaryKey(),
    brokerId: uuid('broker_id')
      .notNull()
      .references(() => brokers.id),
    versionId: uuid('version_id')
      .notNull()
      .references(() => versions.id),
    requestId: uuid('request_id').notNull(),
    inputHash: text('input_hash'),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('broker_activation_request').on(t.brokerId, t.requestId)],
);
export const heads = broker.table('heads', {
  brokerId: uuid('broker_id')
    .primaryKey()
    .references(() => brokers.id),
  versionId: uuid('version_id')
    .notNull()
    .references(() => versions.id),
  preferences: jsonb().$type<Preferences>().notNull(),
  nextVersion: integer('next_version').notNull(),
});
