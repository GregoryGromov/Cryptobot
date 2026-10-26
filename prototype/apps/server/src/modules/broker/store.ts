import { type Preferences, preferencesSchema } from '@reinforce/harness-contract';
import { and, desc, eq } from 'drizzle-orm';
import type { Db, Tx } from '../../platform/db.js';
import { activations, brokers, heads, versions } from './schema.js';
export type BrokerVersion = typeof versions.$inferSelect;
export type Broker = typeof brokers.$inferSelect;
export type Activation = typeof activations.$inferSelect;
export async function findActivationRequest(db: Db, brokerId: string, requestId: string) {
  const [row] = await db
    .select()
    .from(activations)
    .where(and(eq(activations.brokerId, brokerId), eq(activations.requestId, requestId)));
  return row;
}
export async function recordActivation(tx: Tx, activation: Activation) {
  await tx.insert(activations).values(activation);
  await tx
    .update(heads)
    .set({ versionId: activation.versionId })
    .where(eq(heads.brokerId, activation.brokerId));
}
export const defaultPreferences = (): Preferences => ({
  markets: ['SOL', 'BTC', 'ETH'],
  mode: 'daytrader',
  autoAnalysis: true,
  analysisLimit: 10,
  ideaLimit: 10,
  maxTradeUsd: '2000',
  style: '',
  alerts: false,
  actionableOnly: true,
  quiet: { enabled: false, from: 22, to: 8, timezone: 'Europe/Moscow' },
});

export async function findBroker(db: Db, userId: string) {
  const [row] = await db.select().from(brokers).where(eq(brokers.userId, userId));
  return row;
}
export async function findBrokerById(db: Db, id: string) {
  const [row] = await db.select().from(brokers).where(eq(brokers.id, id));
  return row;
}
export async function loadHead(db: Db, brokerId: string) {
  const [row] = await db.select().from(heads).where(eq(heads.brokerId, brokerId));
  if (!row) throw new Error('Broker head missing');
  return { ...row, preferences: preferencesSchema.parse(row.preferences) };
}
export async function findVersion(db: Db, id: string) {
  const [row] = await db.select().from(versions).where(eq(versions.id, id));
  return row;
}
export async function findVersionRequest(db: Db, brokerId: string, requestId: string) {
  const [row] = await db
    .select()
    .from(versions)
    .where(and(eq(versions.brokerId, brokerId), eq(versions.requestId, requestId)));
  return row;
}
export const listVersions = (db: Db, brokerId: string) =>
  db.select().from(versions).where(eq(versions.brokerId, brokerId)).orderBy(desc(versions.number));
export async function recordBroker(tx: Tx, broker: Broker, version: BrokerVersion, activationId: string) {
  await tx.insert(brokers).values(broker);
  await tx.insert(versions).values(version);
  await tx.insert(activations).values({
    id: activationId,
    brokerId: broker.id,
    versionId: version.id,
    requestId: version.requestId,
    createdAt: version.createdAt,
  });
  await tx.insert(heads).values({
    brokerId: broker.id,
    versionId: version.id,
    preferences: defaultPreferences(),
    nextVersion: 2,
  });
}
export async function recordVersion(tx: Tx, version: BrokerVersion, activationId: string) {
  await tx.insert(versions).values(version);
  await tx.insert(activations).values({
    id: activationId,
    brokerId: version.brokerId,
    versionId: version.id,
    requestId: version.requestId,
    createdAt: version.createdAt,
  });
  await tx
    .update(heads)
    .set({ versionId: version.id, nextVersion: version.number + 1 })
    .where(eq(heads.brokerId, version.brokerId));
}
export async function setPreferences(tx: Tx, brokerId: string, preferences: Preferences) {
  await tx.update(heads).set({ preferences }).where(eq(heads.brokerId, brokerId));
}
export const listBrokers = (db: Db) => db.select().from(brokers);
