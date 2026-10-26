import { bigint, integer, jsonb, pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import type { AnalyticsProperties, EventName } from './types.js';

const telemetry = pgSchema('telemetry');
export const events = telemetry.table('events', {
  id: uuid().primaryKey(),
  source: text().notNull(),
  userId: uuid('user_id').notNull(),
  name: text().$type<EventName>().notNull(),
  properties: jsonb().$type<AnalyticsProperties>().notNull(),
  occurredAt: bigint('occurred_at', { mode: 'number' }).notNull(),
});
export const deliveries = telemetry.table('deliveries', {
  eventId: uuid('event_id').primaryKey(),
  status: text().$type<'pending' | 'sending' | 'sent' | 'failed'>().notNull(),
  attempts: integer().notNull(),
  leaseId: uuid('lease_id'),
  leaseUntil: bigint('lease_until', { mode: 'number' }),
  reason: text(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
export const cursors = telemetry.table('cursors', {
  conversationId: uuid('conversation_id').primaryKey(),
  seq: bigint({ mode: 'number' }).notNull(),
});
