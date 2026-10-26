import type { ForecastSubmission } from '@reinforce/harness-contract';
import { bigint, integer, jsonb, pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import type { Baseline } from './domain/baseline.js';
import type { ExperimentDefinition, ExperimentResult } from './domain/experiment.js';
import type { Progress } from './domain/progress.js';
import type { Score, ScoringRules } from './domain/scoring.js';

const forecast = pgSchema('forecast');
export const experiments = forecast.table('experiments', {
  id: uuid().primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  body: jsonb().$type<ExperimentDefinition>().notNull(),
  bodyHash: text('body_hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const experimentResults = forecast.table('experiment_results', {
  experimentId: uuid('experiment_id').notNull(),
  caseId: uuid('case_id').notNull(),
  runId: uuid('run_id').notNull(),
  body: jsonb().$type<ExperimentResult>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const scoringRules = forecast.table('scoring_rules', {
  version: text().primaryKey(),
  body: jsonb().$type<ScoringRules>().notNull(),
  bodyHash: text('body_hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const evaluationBaselines = forecast.table('evaluation_baselines', {
  dispatchId: uuid('dispatch_id').notNull(),
  horizon: integer().notNull(),
  rulesVersion: text('rules_version').notNull(),
  body: jsonb().$type<Baseline>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const dispatches = forecast.table('dispatches', {
  id: uuid().primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  versionId: uuid('version_id').notNull(),
  snapshotId: text('snapshot_id').notNull(),
  eventId: text('event_id'),
  requestId: uuid('request_id'),
  conversationId: uuid('conversation_id').notNull(),
  instrument: text().notNull(),
  origin: text().$type<'event' | 'on-demand'>().notNull(),
  environment: text().$type<'live' | 'replay'>().notNull(),
  t0: bigint({ mode: 'number' }).notNull(),
  deadline: bigint({ mode: 'number' }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  inputHash: text('input_hash').notNull(),
  contractVersion: text('contract_version').notNull(),
  scoringVersion: text('scoring_version').notNull(),
  executionVersion: text('execution_version').notNull(),
});
export const submissions = forecast.table('submissions', {
  id: uuid().primaryKey(),
  dispatchId: uuid('dispatch_id').notNull(),
  brokerId: uuid('broker_id').notNull(),
  versionId: uuid('version_id').notNull(),
  body: jsonb().$type<ForecastSubmission>().notNull(),
  bodyHash: text('body_hash').notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
  cohort: text().$type<'official' | 'late' | 'non-official-timing' | 'on-demand'>().notNull(),
});
export const attempts = forecast.table('attempts', {
  id: uuid().primaryKey(),
  dispatchId: uuid('dispatch_id').notNull(),
  receivedAt: bigint('received_at', { mode: 'number' }).notNull(),
  errors: jsonb().$type<string[]>().notNull(),
});
export const resolutions = forecast.table('resolutions', {
  id: uuid().primaryKey(),
  forecastId: uuid('forecast_id').notNull(),
  horizon: integer().notNull(),
  rulesVersion: text('rules_version').notNull(),
  dataRevision: text('data_revision').notNull(),
  referenceCandle: uuid('reference_candle').notNull(),
  outcomeCandle: uuid('outcome_candle').notNull(),
  score: jsonb().$type<Score>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const baselines = forecast.table('baselines', {
  dispatchId: uuid('dispatch_id').notNull(),
  horizon: integer().notNull(),
  body: jsonb().$type<Baseline>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
/** How far the model has written the forecast of a dispatch, while it streams it; see migration 0019. */
export const progress = forecast.table('progress', {
  dispatchId: uuid('dispatch_id').primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  body: jsonb().$type<Progress>().notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
