import { eq, sql } from 'drizzle-orm';
import type { Db, Tx } from '../db.js';
import { newId } from '../identity.js';
import { enqueue, type Jobs } from '../jobs.js';
import { cursors, deliveries, events } from './schema.js';
import { type AnalyticsEvent, analyticsEventSchema } from './types.js';

export type Delivery = typeof deliveries.$inferSelect;
export async function recordEvent(tx: Tx, jobs: Jobs, source: string, event: Omit<AnalyticsEvent, 'id'>) {
  const value = analyticsEventSchema.parse({ ...event, id: newId() });
  const rows = await tx
    .insert(events)
    .values({ ...value, source })
    .onConflictDoNothing()
    .returning();
  if (!rows.length) return;
  await tx
    .insert(deliveries)
    .values({ eventId: value.id, status: 'pending', attempts: 0, updatedAt: value.occurredAt });
  await enqueue(jobs, tx, 'analytics.send', value.id);
}
export async function findEvent(db: Db, id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  return row;
}
export const listEvents = (db: Db, userId: string) =>
  db.select().from(events).where(eq(events.userId, userId));
export async function findDelivery(db: Db, id: string) {
  const [row] = await db.select().from(deliveries).where(eq(deliveries.eventId, id));
  return row;
}
export const saveDelivery = (tx: Tx, value: Delivery) =>
  tx.update(deliveries).set(value).where(eq(deliveries.eventId, value.eventId));
export async function loadCursor(db: Db, conversationId: string) {
  const [row] = await db.select().from(cursors).where(eq(cursors.conversationId, conversationId));
  return row?.seq ?? 0;
}
export const saveCursor = (tx: Tx, conversationId: string, seq: number) =>
  tx
    .insert(cursors)
    .values({ conversationId, seq })
    .onConflictDoUpdate({ target: cursors.conversationId, set: { seq } });
export const deliveryMetrics = (db: Db) =>
  db
    .select({ status: deliveries.status, count: sql<number>`count(*)::int` })
    .from(deliveries)
    .groupBy(deliveries.status);
export const stalledDeliveries = (db: Db, now: number) =>
  db
    .select()
    .from(deliveries)
    .where(sql`${deliveries.updatedAt} <= ${now - 300000} and
    (${deliveries.status} = 'pending' or (${deliveries.status} = 'sending' and ${deliveries.leaseUntil} <= ${now}))`)
    .limit(100);
