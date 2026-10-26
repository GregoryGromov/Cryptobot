import { and, eq, sql } from 'drizzle-orm';
import { type Db, lock, type Tx } from '../../platform/db.js';
import { newId } from '../../platform/identity.js';
import { attempts, budgets, callResults, calls, environment, runs, workerHealth } from './schema.js';
export type Run = typeof runs.$inferSelect;
export type Call = typeof calls.$inferSelect;
export async function operationalMetrics(db: Db, now: number) {
  const states = await db
    .select({ state: runs.state, count: sql<number>`count(*)::int` })
    .from(runs)
    .groupBy(runs.state);
  const [usage] = await db
    .select({
      calls: sql<number>`count(*)::int`,
      errors: sql<number>`count(*) filter (where ${callResults.body} ? 'error')::int`,
      unknownCost: sql<number>`count(*) filter (where ${callResults.body}->>'cost' is null)::int`,
      cost: sql<number>`coalesce(sum((${callResults.body}->>'cost')::numeric), 0)::float8`,
      inputTokens: sql<number>`coalesce(sum((${callResults.body}->>'inputTokens')::numeric), 0)::float8`,
      outputTokens: sql<number>`coalesce(sum((${callResults.body}->>'outputTokens')::numeric), 0)::float8`,
    })
    .from(calls)
    .leftJoin(callResults, eq(calls.id, callResults.callId));
  const [expired] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .where(sql`${runs.state} = 'running' and ${runs.leaseUntil} <= ${now}`);
  const [retries] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attempts)
    .where(sql`${attempts.kind} = 'started' and ${attempts.number} > 1`);
  return { states, usage: usage!, expired: expired!.count, retries: retries!.count };
}
export const listRuns = (db: Db, brokerId: string) =>
  db.select().from(runs).where(eq(runs.brokerId, brokerId));
export async function ensureRun(
  tx: Tx,
  input: Omit<Run, 'attempt' | 'state' | 'output' | 'leaseUntil'>,
): Promise<Run> {
  await tx
    .insert(runs)
    .values({ ...input, attempt: 0, state: 'pending', output: null })
    .onConflictDoNothing();
  const [row] = await tx
    .select()
    .from(runs)
    .where(and(eq(runs.kind, input.kind), eq(runs.sourceId, input.sourceId)));
  if (
    !row ||
    row.brokerId !== input.brokerId ||
    row.versionId !== input.versionId ||
    row.experimentId !== input.experimentId
  )
    throw new Error('Run identity mismatch');
  return row;
}
export async function findRun(db: Db, id: string): Promise<Run | undefined> {
  const [row] = await db.select().from(runs).where(eq(runs.id, id));
  return row;
}
export async function loadRun(db: Db, id: string): Promise<Run> {
  const row = await findRun(db, id);
  if (!row) throw new Error('Run missing');
  return row;
}
export async function beginAttempt(tx: Tx, run: Run, now: number, leaseUntil: number) {
  const next = run.attempt + 1;
  await tx
    .update(runs)
    .set({ attempt: next, state: 'running', output: null, leaseUntil })
    .where(eq(runs.id, run.id));
  await tx
    .insert(attempts)
    .values({ id: newId(), runId: run.id, number: next, kind: 'started', body: {}, createdAt: now });
  return next;
}
export async function finishAttempt(
  tx: Tx,
  runId: string,
  number: number,
  body: Record<string, unknown>,
  now: number,
  succeeded: boolean,
) {
  await tx
    .insert(attempts)
    .values({ id: newId(), runId, number, kind: 'finished', body, createdAt: now })
    .onConflictDoNothing();
  const changed = await tx
    .update(runs)
    .set({ state: succeeded ? 'succeeded' : 'failed', output: body, leaseUntil: null })
    .where(and(eq(runs.id, runId), eq(runs.attempt, number), eq(runs.state, 'running')))
    .returning();
  return changed.length === 1;
}
export async function reserveBudget(
  tx: Tx,
  scopes: { scope: string; day: number; limit: number }[],
): Promise<boolean> {
  for (const entry of [...scopes].sort((a, b) => a.scope.localeCompare(b.scope))) {
    await lock(tx, 'budget', `${entry.day}:${entry.scope}`);
    await tx
      .insert(budgets)
      .values({ scope: entry.scope, day: entry.day, reserved: 0, spent: 0 })
      .onConflictDoNothing();
  }
  for (const entry of scopes) {
    const [budget] = await tx
      .select()
      .from(budgets)
      .where(and(eq(budgets.scope, entry.scope), eq(budgets.day, entry.day)));
    if (!budget || budget.reserved + budget.spent >= entry.limit) return false;
  }
  for (const entry of scopes)
    await tx
      .update(budgets)
      .set({ reserved: sql`${budgets.reserved} + 1` })
      .where(and(eq(budgets.scope, entry.scope), eq(budgets.day, entry.day)));
  return true;
}
export async function recordCall(tx: Tx, call: Call) {
  await tx.insert(calls).values(call);
}
export async function expireAttempt(tx: Tx, run: Run, now: number) {
  const previous = await tx
    .select()
    .from(calls)
    .where(and(eq(calls.runId, run.id), eq(calls.attempt, run.attempt)));
  for (const call of previous) await finishCall(tx, call, { error: 'unknown-after-interruption' }, now);
  await finishAttempt(tx, run.id, run.attempt, { error: 'lease-expired' }, now, false);
}
export async function finishCall(tx: Tx, call: Call, body: Record<string, unknown>, now: number) {
  const inserted = await tx
    .insert(callResults)
    .values({ callId: call.id, body, createdAt: now })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return;
  // A failed or unknown external call consumes its reserved call allowance too.
  for (const entry of [...call.budgetScopes].sort((a, b) => a.scope.localeCompare(b.scope)))
    await tx
      .update(budgets)
      .set({ reserved: sql`${budgets.reserved} - 1`, spent: sql`${budgets.spent} + 1` })
      .where(and(eq(budgets.scope, entry.scope), eq(budgets.day, entry.day)));
}
export const quotaUsage = async (db: Db, scope: string, day: number) => {
  const [row] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.scope, scope), eq(budgets.day, day)));
  return row ? { reserved: row.reserved, spent: row.spent } : { reserved: 0, spent: 0 };
};

export async function heartbeat(db: Db, id: string, now: number) {
  await db
    .insert(workerHealth)
    .values({ id, updatedAt: now })
    .onConflictDoUpdate({ target: workerHealth.id, set: { updatedAt: now } });
}
export async function workerReady(db: Db, now: number): Promise<boolean> {
  const [row] = await db
    .select()
    .from(workerHealth)
    .where(sql`${workerHealth.updatedAt} >= ${now - 35000}`)
    .limit(1);
  return Boolean(row);
}
export async function stopHeartbeat(db: Db, id: string) {
  await db.delete(workerHealth).where(eq(workerHealth.id, id));
}

export async function bindEnvironment(db: Db, mode: 'replay' | 'live') {
  await db.insert(environment).values({ singleton: true, mode }).onConflictDoNothing();
  const [stored] = await db.select().from(environment).limit(1);
  if (stored?.mode !== mode)
    throw new Error('Market mode differs from database environment. Use a separate database.');
}
