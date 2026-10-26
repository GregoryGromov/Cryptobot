import type { ProposalTerms } from '@reinforce/harness-contract';
import { bigint, integer, jsonb, numeric, pgSchema, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { ExecutionRules } from './domain/execution.js';

const trading = pgSchema('trading');
export const accounts = trading.table(
  'accounts',
  {
    id: uuid().primaryKey(),
    userId: uuid('user_id').notNull(),
    brokerId: uuid('broker_id').notNull(),
    kind: text().$type<'broker' | 'user'>().notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('trading_user_kind').on(t.userId, t.kind)],
);
export const cycles = trading.table('cycles', {
  id: uuid().primaryKey(),
  accountId: uuid('account_id').notNull(),
  number: integer().notNull(),
  startCapital: numeric('start_capital').notNull(),
  previousLoss: numeric('previous_loss').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const heads = trading.table('heads', {
  accountId: uuid('account_id').primaryKey(),
  cycleId: uuid('cycle_id').notNull(),
  capital: numeric().notNull(),
  currentOrderId: uuid('current_order_id'),
  asOf: bigint('as_of', { mode: 'number' }).notNull(),
});
export const proposals = trading.table('proposals', {
  id: uuid().primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  conversationId: uuid('conversation_id').notNull(),
  versionId: uuid('version_id').notNull(),
  forecastId: uuid('forecast_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const proposalVersions = trading.table('proposal_versions', {
  id: uuid().primaryKey(),
  proposalId: uuid('proposal_id').notNull(),
  number: integer().notNull(),
  terms: jsonb().$type<ProposalTerms>().notNull(),
  validUntil: bigint('valid_until', { mode: 'number' }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  sourceId: text('source_id').notNull(),
});
export const decisions = trading.table('proposal_decisions', {
  id: uuid().primaryKey(),
  proposalId: uuid('proposal_id').notNull(),
  versionId: uuid('version_id').notNull(),
  userId: uuid('user_id').notNull(),
  decision: text().$type<'confirmed' | 'declined'>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const orders = trading.table('orders', {
  id: uuid().primaryKey(),
  accountId: uuid('account_id').notNull(),
  cycleId: uuid('cycle_id').notNull(),
  sourceKind: text('source_kind').notNull(),
  sourceId: text('source_id').notNull(),
  versionId: uuid('version_id').notNull(),
  terms: jsonb().$type<ProposalTerms>().notNull(),
  entryAt: bigint('entry_at', { mode: 'number' }).notNull(),
  rules: jsonb().$type<ExecutionRules>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const executions = trading.table('executions', {
  id: uuid().primaryKey(),
  orderId: uuid('order_id').notNull(),
  kind: text().$type<'entry' | 'exit' | 'rejected'>().notNull(),
  body: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const brokerAdmissions = trading.table('broker_admissions', {
  dispatchId: uuid('dispatch_id').primaryKey(),
  accountId: uuid('account_id').notNull(),
  forecastId: uuid('forecast_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const brokerResults = trading.table('broker_results', {
  dispatchId: uuid('dispatch_id').primaryKey(),
  kind: text().$type<'ordered' | 'flat' | 'account-busy' | 'non-official'>().notNull(),
  orderId: uuid('order_id'),
  rulesVersion: text('rules_version').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
