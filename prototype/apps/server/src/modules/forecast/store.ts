import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db, Tx } from '../../platform/db.js';
import { payloadHash } from '../../platform/identity.js';
import { SCORING_RULES, type ScoringRules } from './domain/scoring.js';
import {
  attempts,
  baselines,
  dispatches,
  evaluationBaselines,
  experimentResults,
  experiments,
  progress,
  resolutions,
  scoringRules,
  submissions,
} from './schema.js';
export type Dispatch = typeof dispatches.$inferSelect;
export type Forecast = typeof submissions.$inferSelect;
export async function operationalMetrics(db: Db, now: number) {
  const cohorts = await db
    .select({ cohort: submissions.cohort, count: sql<number>`count(*)::int` })
    .from(submissions)
    .groupBy(submissions.cohort);
  const origins = await db
    .select({
      origin: dispatches.origin,
      count: sql<number>`count(*)::int`,
      delaySum: sql<number>`coalesce(sum(greatest(0, ${dispatches.createdAt} - (${dispatches.t0} - 60000))), 0)::float8 / 1000`,
    })
    .from(dispatches)
    .groupBy(dispatches.origin);
  const [invalid] = await db.select({ count: sql<number>`count(*)::int` }).from(attempts);
  const due = await db.execute<{ count: number; oldest: number }>(sql`
    select count(*)::int as count, coalesce(max(${now} - (${dispatches.t0} + h.horizon * 60000)), 0)::float8 / 1000 as oldest
    from ${submissions} join ${dispatches} on ${dispatches.id} = ${submissions.dispatchId}
    cross join (values (5),(15),(30),(60)) as h(horizon)
    where ${submissions.receivedAt} < ${dispatches.t0} and ${dispatches.t0} + h.horizon * 60000 <= ${now}
    and not exists (select 1 from ${resolutions} where ${resolutions.forecastId} = ${submissions.id}
      and ${resolutions.horizon} = h.horizon and ${resolutions.rulesVersion} = ${dispatches.scoringVersion})`);
  const [latency] = await db
    .select({
      count: sql<number>`count(*)::int`,
      seconds: sql<number>`coalesce(sum(greatest(0, ${submissions.receivedAt} - ${dispatches.createdAt})), 0)::float8 / 1000`,
    })
    .from(submissions)
    .innerJoin(dispatches, eq(submissions.dispatchId, dispatches.id));
  return { cohorts, origins, invalid: invalid!.count, due: due.rows[0]!, latency: latency! };
}
export const pendingMarketInstruments = (db: Db) =>
  db
    .selectDistinct({ instrument: dispatches.instrument })
    .from(dispatches)
    .innerJoin(submissions, eq(submissions.dispatchId, dispatches.id))
    .where(sql`(select count(distinct ${resolutions.horizon}) from ${resolutions}
    where ${resolutions.forecastId} = ${submissions.id}
    and ${resolutions.rulesVersion} = ${dispatches.scoringVersion}) < 4`);
export async function findRequestDispatch(db: Db, brokerId: string, requestId: string) {
  const [row] = await db
    .select()
    .from(dispatches)
    .where(and(eq(dispatches.brokerId, brokerId), eq(dispatches.requestId, requestId)));
  return row;
}
export const listBrokerForecasts = (db: Db, brokerId: string) =>
  db
    .select()
    .from(submissions)
    .where(eq(submissions.brokerId, brokerId))
    .orderBy(desc(submissions.receivedAt));
export const listDispatches = (db: Db, brokerId: string) =>
  db.select().from(dispatches).where(eq(dispatches.brokerId, brokerId)).orderBy(desc(dispatches.createdAt));
export async function findDispatch(db: Db, id: string) {
  const [row] = await db.select().from(dispatches).where(eq(dispatches.id, id));
  return row;
}
export async function findEventDispatch(db: Db, brokerId: string, eventId: string) {
  const [row] = await db
    .select()
    .from(dispatches)
    .where(and(eq(dispatches.brokerId, brokerId), eq(dispatches.eventId, eventId)));
  return row;
}
export async function recordDispatch(tx: Tx, dispatch: Dispatch) {
  await tx.insert(dispatches).values(dispatch);
}
export async function findSubmission(db: Db, dispatchId: string) {
  const [row] = await db.select().from(submissions).where(eq(submissions.dispatchId, dispatchId));
  return row;
}
export async function findForecast(db: Db, id: string) {
  const [row] = await db.select().from(submissions).where(eq(submissions.id, id));
  return row;
}
export async function recordSubmission(tx: Tx, submission: Forecast) {
  await tx.insert(submissions).values(submission);
}
export async function recordAttempt(tx: Tx, attempt: typeof attempts.$inferInsert) {
  await tx.insert(attempts).values(attempt);
}
export async function recordResolution(tx: Tx, resolution: typeof resolutions.$inferInsert) {
  return tx.insert(resolutions).values(resolution).onConflictDoNothing().returning();
}
export const listResolutions = (db: Db, forecastId: string) =>
  db.select().from(resolutions).where(eq(resolutions.forecastId, forecastId));

export async function recordBaseline(tx: Tx, value: typeof baselines.$inferInsert) {
  await tx.insert(baselines).values(value);
}
export const listBaselines = (db: Db, dispatchId: string) =>
  db.select().from(baselines).where(eq(baselines.dispatchId, dispatchId));

export async function registerScoringRules(tx: Tx, rules: ScoringRules, now: number) {
  const bodyHash = payloadHash(rules);
  if (rules.version === SCORING_RULES.version && bodyHash !== payloadHash(SCORING_RULES))
    throw new Error('Scoring version already has different rules');
  await tx
    .insert(scoringRules)
    .values({ version: rules.version, body: rules, bodyHash, createdAt: now })
    .onConflictDoNothing();
  const stored = await findScoringRules(tx, rules.version);
  if (stored?.bodyHash !== bodyHash) throw new Error('Scoring version already has different rules');
}
export async function findScoringRules(db: Db, version: string) {
  const [row] = await db.select().from(scoringRules).where(eq(scoringRules.version, version));
  return row;
}
export async function recordEvaluationBaseline(tx: Tx, value: typeof evaluationBaselines.$inferInsert) {
  await tx.insert(evaluationBaselines).values(value).onConflictDoNothing();
}
export const listEvaluationBaselines = (db: Db, dispatchId: string) =>
  db.select().from(evaluationBaselines).where(eq(evaluationBaselines.dispatchId, dispatchId));

export async function recordExperiment(tx: Tx, value: typeof experiments.$inferInsert) {
  await tx.insert(experiments).values(value).onConflictDoNothing();
  const [stored] = await tx.select().from(experiments).where(eq(experiments.id, value.id));
  if (!stored || stored.brokerId !== value.brokerId || stored.bodyHash !== value.bodyHash)
    throw new Error('Experiment identity changed');
}
export const listExperimentResults = (db: Db, experimentId: string) =>
  db.select().from(experimentResults).where(eq(experimentResults.experimentId, experimentId));
export async function recordExperimentResult(tx: Tx, value: typeof experimentResults.$inferInsert) {
  await tx.insert(experimentResults).values(value).onConflictDoNothing();
}

export type ProgressRow = typeof progress.$inferSelect;
export async function writeProgress(db: Db, row: ProgressRow) {
  await db
    .insert(progress)
    .values(row)
    .onConflictDoUpdate({ target: progress.dispatchId, set: { body: row.body, updatedAt: row.updatedAt } });
}
export const listProgress = (db: Db, conversationId: string): Promise<ProgressRow[]> =>
  db.select().from(progress).where(eq(progress.conversationId, conversationId)).orderBy(progress.dispatchId);
export async function dropProgress(db: Db, dispatchId: string) {
  await db.delete(progress).where(eq(progress.dispatchId, dispatchId));
}
