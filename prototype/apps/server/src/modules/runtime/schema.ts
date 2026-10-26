import { bigint, boolean, integer, json, jsonb, pgSchema, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

const runtime = pgSchema('runtime');
export const runs = runtime.table('runs', {
  id: uuid().primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  versionId: uuid('version_id'),
  experimentId: uuid('experiment_id'),
  kind: text().notNull(),
  sourceId: text('source_id').notNull(),
  state: text().$type<'pending' | 'running' | 'succeeded' | 'failed'>().notNull(),
  attempt: integer().notNull(),
  leaseUntil: bigint('lease_until', { mode: 'number' }),
  // json, not jsonb: the order of the schema's keys is the order the model writes in; see migration 0020.
  input: json().$type<Record<string, unknown>>().notNull(),
  output: jsonb().$type<Record<string, unknown>>(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const attempts = runtime.table('attempts', {
  id: uuid().primaryKey(),
  runId: uuid('run_id').notNull(),
  number: integer().notNull(),
  kind: text().notNull(),
  body: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const budgets = runtime.table(
  'budgets',
  {
    scope: text().notNull(),
    day: integer().notNull(),
    reserved: integer().notNull(),
    spent: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.scope, t.day] })],
);
export const calls = runtime.table('calls', {
  id: uuid().primaryKey(),
  runId: uuid('run_id').notNull(),
  userId: uuid('user_id').notNull(),
  attempt: integer().notNull(),
  model: text().notNull(),
  route: text().notNull(),
  automatic: boolean().notNull(),
  maxTokens: integer('max_tokens').notNull(),
  budgetScopes: jsonb('budget_scopes').$type<{ scope: string; day: number }[]>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const callResults = runtime.table('call_results', {
  callId: uuid('call_id').primaryKey(),
  body: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const workerHealth = runtime.table('worker_health', {
  id: uuid().primaryKey(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const environment = runtime.table('environment', {
  singleton: boolean().primaryKey(),
  mode: text().$type<'replay' | 'live'>().notNull(),
});
