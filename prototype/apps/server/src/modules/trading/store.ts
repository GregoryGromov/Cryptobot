import { proposalTermsSchema } from '@reinforce/harness-contract';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db, Tx } from '../../platform/db.js';
import { newId } from '../../platform/identity.js';
import { EXECUTION_RULES } from './domain/execution.js';
import {
  accounts,
  brokerAdmissions,
  brokerResults,
  cycles,
  decisions,
  executions,
  heads,
  orders,
  proposals,
  proposalVersions,
} from './schema.js';
export type Order = typeof orders.$inferSelect;
export async function operationalMetrics(db: Db, now: number) {
  const result = await db.execute<{ count: number; overdue: number; oldest: number }>(sql`
    select count(*)::int as count,
      count(*) filter (where ${orders.entryAt} + (${orders.terms}->>'horizon')::int * 60000 <= ${now})::int as overdue,
      coalesce(max(greatest(0, ${now} - ${orders.entryAt} - (${orders.terms}->>'horizon')::int * 60000)), 0)::float8 / 1000 as oldest
    from ${orders} where not exists (select 1 from ${executions}
      where ${executions.orderId} = ${orders.id} and ${executions.kind} in ('exit','rejected'))`);
  return result.rows[0]!;
}
export const pendingMarketInstruments = async (db: Db) => {
  const rows = await db
    .select({ terms: orders.terms })
    .from(orders)
    .where(sql`not exists (select 1 from ${executions}
      where ${executions.orderId} = ${orders.id} and ${executions.kind} in ('exit', 'rejected'))`);
  return rows.map((row) => ({ instrument: row.terms.instrument }));
};
export type Proposal = typeof proposals.$inferSelect;
export type ProposalVersion = typeof proposalVersions.$inferSelect;
export const listProposals = (db: Db, brokerId: string) =>
  db.select().from(proposals).where(eq(proposals.brokerId, brokerId));
export const listProposalVersions = (db: Db, proposalId: string) =>
  db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, proposalId))
    .orderBy(desc(proposalVersions.number));
export const listCycles = (db: Db, accountId: string) =>
  db.select().from(cycles).where(eq(cycles.accountId, accountId)).orderBy(desc(cycles.number));
export const createAccounts = async (tx: Tx, userId: string, brokerId: string, now: number) => {
  for (const kind of ['broker', 'user'] as const) {
    const id = newId();
    const cycleId = newId();
    await tx.insert(accounts).values({ id, userId, brokerId, kind, createdAt: now });
    await tx.insert(cycles).values({
      id: cycleId,
      accountId: id,
      number: 1,
      startCapital: EXECUTION_RULES.startCapital,
      previousLoss: '0',
      createdAt: now,
    });
    await tx.insert(heads).values({
      accountId: id,
      cycleId,
      capital: EXECUTION_RULES.startCapital,
      currentOrderId: null,
      asOf: now,
    });
  }
};
export async function findAccount(db: Db, userId: string, kind: 'broker' | 'user') {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.kind, kind)));
  return row;
}
export async function findAccountById(db: Db, id: string) {
  const [row] = await db.select().from(accounts).where(eq(accounts.id, id));
  return row;
}
export async function loadHead(db: Db, accountId: string) {
  const [row] = await db.select().from(heads).where(eq(heads.accountId, accountId));
  if (!row) throw new Error('Trading head missing');
  return row;
}
export async function findProposal(db: Db, proposalId: string) {
  const [row] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
  return row;
}
export async function findProposalVersion(db: Db, versionId: string) {
  const [row] = await db.select().from(proposalVersions).where(eq(proposalVersions.id, versionId));
  return row ? { ...row, terms: proposalTermsSchema.parse(row.terms) } : undefined;
}
export async function latestProposalVersion(db: Db, proposalId: string) {
  const [row] = await db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, proposalId))
    .orderBy(desc(proposalVersions.number))
    .limit(1);
  return row ? { ...row, terms: proposalTermsSchema.parse(row.terms) } : undefined;
}
export async function findDecision(db: Db, proposalId: string) {
  const [row] = await db.select().from(decisions).where(eq(decisions.proposalId, proposalId));
  return row;
}
export async function recordProposal(tx: Tx, proposal: Proposal, version: ProposalVersion) {
  await tx.insert(proposals).values(proposal);
  await tx.insert(proposalVersions).values(version);
}
export async function recordProposalVersion(tx: Tx, version: ProposalVersion) {
  await tx.insert(proposalVersions).values(version);
}
export async function recordDecision(tx: Tx, decision: typeof decisions.$inferInsert) {
  await tx.insert(decisions).values(decision);
}
export async function recordOrder(tx: Tx, order: Order) {
  await tx.insert(orders).values(order);
  await tx.update(heads).set({ currentOrderId: order.id }).where(eq(heads.accountId, order.accountId));
}
export async function findOrder(db: Db, id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  return row;
}
export async function findSourceOrder(db: Db, accountId: string, kind: string, sourceId: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.accountId, accountId), eq(orders.sourceKind, kind), eq(orders.sourceId, sourceId)));
  return row;
}
export const listOrders = (db: Db, accountId: string) =>
  db.select().from(orders).where(eq(orders.accountId, accountId)).orderBy(desc(orders.createdAt));
export const listExecutions = (db: Db, orderId: string) =>
  db.select().from(executions).where(eq(executions.orderId, orderId));
export async function recordExecution(tx: Tx, execution: typeof executions.$inferInsert) {
  await tx.insert(executions).values(execution).onConflictDoNothing();
}
export async function updateHead(
  tx: Tx,
  accountId: string,
  patch: Partial<Pick<typeof heads.$inferInsert, 'capital' | 'currentOrderId' | 'asOf' | 'cycleId'>>,
) {
  await tx.update(heads).set(patch).where(eq(heads.accountId, accountId));
}
export async function resetBankruptCycle(tx: Tx, accountId: string, loss: string, now: number) {
  const [previous] = await tx
    .select()
    .from(cycles)
    .where(eq(cycles.accountId, accountId))
    .orderBy(desc(cycles.number))
    .limit(1);
  if (!previous) throw new Error('Cycle missing');
  const cycle = {
    id: newId(),
    accountId,
    number: previous.number + 1,
    startCapital: EXECUTION_RULES.startCapital,
    previousLoss: loss,
    createdAt: now,
  };
  await tx.insert(cycles).values(cycle);
  await updateHead(tx, accountId, {
    cycleId: cycle.id,
    capital: cycle.startCapital,
    currentOrderId: null,
    asOf: now,
  });
}

export const listBrokerAdmissions = (db: Db, accountId: string) =>
  db.select().from(brokerAdmissions).where(eq(brokerAdmissions.accountId, accountId));
export async function recordBrokerAdmission(tx: Tx, value: typeof brokerAdmissions.$inferInsert) {
  await tx.insert(brokerAdmissions).values(value).onConflictDoNothing();
}
export async function findBrokerResult(db: Db, dispatchId: string) {
  const [row] = await db.select().from(brokerResults).where(eq(brokerResults.dispatchId, dispatchId));
  return row;
}
export async function recordBrokerResult(tx: Tx, value: typeof brokerResults.$inferInsert) {
  await tx.insert(brokerResults).values(value);
}

export async function replaceHead(tx: Tx, head: typeof heads.$inferInsert) {
  await tx.insert(heads).values(head).onConflictDoUpdate({ target: heads.accountId, set: head });
}
