import { bigint, jsonb, numeric, pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import type { AtpCatalog } from '../../adapters/atp-signal.js';

const market = pgSchema('market');
export const snapshots = market.table('snapshots', {
  id: text().primaryKey(),
  instrument: text().notNull(),
  cutoffAt: bigint('cutoff_at', { mode: 'number' }).notNull(),
  inputHash: text('input_hash').notNull(),
  raw: text().notNull(),
  body: jsonb().$type<Record<string, unknown>>().notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
  quality: text().$type<'valid' | 'stale' | 'insufficient-history' | 'unavailable'>().notNull(),
});
export const events = market.table('events', {
  id: text().primaryKey(),
  instrument: text().notNull(),
  snapshotId: text('snapshot_id').notNull(),
  barEnd: bigint('bar_end', { mode: 'number' }).notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
  body: jsonb().$type<Record<string, unknown>>().notNull(),
});
export const candles = market.table('candles', {
  id: uuid().primaryKey(),
  instrument: text().notNull(),
  openAt: bigint('open_at', { mode: 'number' }).notNull(),
  revision: text().notNull(),
  open: numeric().notNull(),
  high: numeric().notNull(),
  low: numeric().notNull(),
  close: numeric().notNull(),
  volume: numeric().notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
});
export const cursors = market.table('cursors', {
  source: text().primaryKey(),
  cursor: text().notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
export const observations = market.table('observations', {
  id: uuid().primaryKey(),
  instrument: text().notNull(),
  snapshotId: text('snapshot_id'),
  status: text().$type<'OK' | 'STALE' | 'INSUFFICIENT_HISTORY' | 'UNAVAILABLE' | 'ERROR'>().notNull(),
  reasons: jsonb().$type<string[]>().notNull(),
  rawResponse: text('raw_response'),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
});
export const refreshes = market.table('refreshes', {
  key: text().primaryKey(),
  observationId: uuid('observation_id'),
  nextAt: bigint('next_at', { mode: 'number' }).notNull(),
  leaseId: uuid('lease_id'),
  leaseUntil: bigint('lease_until', { mode: 'number' }).notNull(),
});
export const catalog = market.table('catalog', {
  id: text().primaryKey(),
  body: jsonb().$type<AtpCatalog>().notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
});
