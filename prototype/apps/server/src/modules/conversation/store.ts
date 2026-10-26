import { and, asc, desc, eq, gt, inArray, lt, lte, or, sql } from 'drizzle-orm';
import { type Db, lock, type Tx } from '../../platform/db.js';
import { newId } from '../../platform/identity.js';
import {
  conversations,
  entries,
  responseDrafts,
  responseLeases,
  telegramCursors,
  telegramDeliveries,
} from './schema.js';
export type Conversation = typeof conversations.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export const listJournalHeads = (db: Db) => db.select().from(conversations);
export const dispatchCoverage = (db: Db) =>
  db
    .select({
      outcome: sql<string>`case when ${entries.kind} = 'market-event' then 'dispatched'
    when ${entries.body}->>'reason' in ('auto-off','data-quality','analysis-limit') then ${entries.body}->>'reason' else 'other' end`,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(sql`${entries.kind} in ('market-event','dispatch-skipped')`)
    .groupBy(sql`1`);
export async function findEntry(db: Db, id: string) {
  const [row] = await db.select().from(entries).where(eq(entries.id, id));
  return row;
}
export async function findSourceEntry(db: Db, conversationId: string, kind: string, sourceId: string) {
  const [row] = await db
    .select()
    .from(entries)
    .where(
      and(eq(entries.conversationId, conversationId), eq(entries.kind, kind), eq(entries.sourceId, sourceId)),
    );
  return row;
}
export async function ensureConversation(
  tx: Tx,
  userId: string,
  brokerId: string,
  topic: string,
): Promise<Conversation> {
  await tx
    .insert(conversations)
    .values({ id: newId(), userId, brokerId, topic, nextSeq: 1, readSeq: 0 })
    .onConflictDoNothing();
  const [row] = await tx
    .select()
    .from(conversations)
    .where(and(eq(conversations.brokerId, brokerId), eq(conversations.topic, topic)));
  if (!row || row.userId !== userId) throw new Error('Conversation ownership mismatch');
  return row;
}
export const findConversation = async (db: Db, id: string, userId: string) => {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  return row;
};
export const findTopic = async (db: Db, userId: string, topic: string) => {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.topic, topic)));
  return row;
};
export const listConversations = (db: Db, userId: string) =>
  db.select().from(conversations).where(eq(conversations.userId, userId));
export async function appendEntry(tx: Tx, input: Omit<Entry, 'seq'>): Promise<Entry> {
  await lock(tx, 'conversation', input.conversationId);
  const [prior] = await tx
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.conversationId, input.conversationId),
        eq(entries.kind, input.kind),
        eq(entries.sourceId, input.sourceId),
      ),
    );
  if (prior) return prior;
  const [head] = await tx
    .update(conversations)
    .set({ nextSeq: sql`${conversations.nextSeq} + 1` })
    .where(eq(conversations.id, input.conversationId))
    .returning();
  if (!head) throw new Error('Conversation missing');
  const entry = { ...input, seq: head.nextSeq - 1 };
  await tx.insert(entries).values(entry);
  return entry;
}
export const readEntries = (db: Db, conversationId: string, after = 0, limit = 100) =>
  db
    .select()
    .from(entries)
    .where(and(eq(entries.conversationId, conversationId), gt(entries.seq, after)))
    .orderBy(asc(entries.seq))
    .limit(limit);
export async function recentEntries(db: Db, conversationId: string, throughSeq: number, limit = 20) {
  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.conversationId, conversationId), lte(entries.seq, throughSeq)))
    .orderBy(desc(entries.seq))
    .limit(limit);
  return rows.reverse();
}
/** Of `runIds`, those that failed in one of `conversationIds`: a failed run leaves a run-error keyed by it. */
export async function erroredRuns(db: Db, conversationIds: string[], runIds: string[]) {
  if (!conversationIds.length || !runIds.length) return new Set<string>();
  const rows = await db
    .select({ runId: entries.sourceId })
    .from(entries)
    .where(
      and(
        inArray(entries.conversationId, conversationIds),
        eq(entries.kind, 'run-error'),
        inArray(entries.sourceId, runIds),
      ),
    );
  return new Set(rows.map((row) => row.runId));
}
export async function latestForecastEntry(db: Db, conversationId: string, throughSeq: number) {
  const [row] = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.conversationId, conversationId),
        eq(entries.kind, 'forecast'),
        lte(entries.seq, throughSeq),
      ),
    )
    .orderBy(desc(entries.seq))
    .limit(1);
  return row;
}
export async function responseHistory(db: Db, conversationId: string, throughSeq: number, limit = 20) {
  const rows = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.conversationId, conversationId),
        or(
          lte(entries.seq, throughSeq),
          sql`(
      ${entries.kind} in ('broker-message', 'proposal') and exists (
        select 1 from conversation.entries earlier
        where earlier.conversation_id = ${conversationId} and earlier.seq < ${throughSeq}
          and earlier.id::text = ${entries.body}->>'replyTo'
      )
    )`,
        ),
      ),
    )
    .orderBy(desc(entries.seq))
    .limit(limit);
  return rows.reverse();
}
export async function firstUnansweredEntry(db: Db, conversationId: string, beforeSeq?: number) {
  const [row] = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.conversationId, conversationId),
        beforeSeq === undefined ? undefined : lt(entries.seq, beforeSeq),
        sql`${entries.kind} in ('user-message', 'forecast')`,
        sql`not exists (
      select 1 from conversation.entries done
      where done.conversation_id = ${conversationId} and (
        (done.kind = 'broker-message' and done.source_id = ${entries.id}::text) or
        (done.kind = 'run-error' and done.body->>'sourceId' = ${entries.id}::text)
      )
    )`,
      ),
    )
    .orderBy(asc(entries.seq))
    .limit(1);
  return row;
}
export const responseLease = async (db: Db, conversationId: string) =>
  (await db.select().from(responseLeases).where(eq(responseLeases.conversationId, conversationId)))[0];
export async function setResponseLease(tx: Tx, conversationId: string, token: string, leaseUntil: number) {
  await tx
    .insert(responseLeases)
    .values({ conversationId, token, leaseUntil })
    .onConflictDoUpdate({ target: responseLeases.conversationId, set: { token, leaseUntil } });
}
export async function releaseResponseLease(tx: Tx, conversationId: string, token: string) {
  const released = await tx
    .delete(responseLeases)
    .where(and(eq(responseLeases.conversationId, conversationId), eq(responseLeases.token, token)))
    .returning();
  return released.length === 1;
}
export type Draft = typeof responseDrafts.$inferSelect;
export async function writeDraft(db: Db, draft: Draft) {
  await db
    .insert(responseDrafts)
    .values(draft)
    .onConflictDoUpdate({
      target: responseDrafts.conversationId,
      set: { runId: draft.runId, sourceId: draft.sourceId, text: draft.text, updatedAt: draft.updatedAt },
    });
}
export const findDraft = async (db: Db, conversationId: string): Promise<Draft | undefined> =>
  (await db.select().from(responseDrafts).where(eq(responseDrafts.conversationId, conversationId)))[0];
export async function dropDraft(db: Db, conversationId: string) {
  await db.delete(responseDrafts).where(eq(responseDrafts.conversationId, conversationId));
}
export const markRead = async (tx: Tx, id: string, seq: number) => {
  await tx
    .update(conversations)
    .set({ readSeq: sql`greatest(${conversations.readSeq}, least(${seq}, ${conversations.nextSeq} - 1))` })
    .where(eq(conversations.id, id));
};

export type TelegramDelivery = typeof telegramDeliveries.$inferSelect;
export const telegramCursor = async (db: Db, linkId: string, conversationId: string) =>
  (
    await db
      .select()
      .from(telegramCursors)
      .where(and(eq(telegramCursors.linkId, linkId), eq(telegramCursors.conversationId, conversationId)))
  )[0]?.seq ?? 0;
export const setTelegramCursor = async (tx: Tx, linkId: string, conversationId: string, seq: number) => {
  await tx
    .insert(telegramCursors)
    .values({ linkId, conversationId, seq })
    .onConflictDoUpdate({
      target: [telegramCursors.linkId, telegramCursors.conversationId],
      set: { seq },
    });
};
export const recordTelegramDelivery = async (tx: Tx, value: typeof telegramDeliveries.$inferInsert) => {
  await tx.insert(telegramDeliveries).values(value);
};
export const findTelegramDelivery = async (db: Db, id: string) =>
  (await db.select().from(telegramDeliveries).where(eq(telegramDeliveries.id, id)))[0];
export const findTelegramMessage = async (db: Db, linkId: string, messageId: number) =>
  (
    await db
      .select()
      .from(telegramDeliveries)
      .where(and(eq(telegramDeliveries.linkId, linkId), eq(telegramDeliveries.messageId, messageId)))
  )[0];
export const updateTelegramDelivery = async (
  tx: Tx,
  id: string,
  patch: Partial<
    Pick<
      TelegramDelivery,
      'status' | 'attempts' | 'notBefore' | 'attemptId' | 'leaseUntil' | 'messageId' | 'payload'
    >
  >,
) => {
  await tx.update(telegramDeliveries).set(patch).where(eq(telegramDeliveries.id, id));
};
const SPOKEN_KINDS = ['user-message', 'analysis-request', 'broker-message', 'forecast'];
/** What was said in a user's conversations with `needle` in it, the latest first: the user's words and the broker's. */
export const searchEntries = (db: Db, userId: string, needle: string, limit: number) =>
  db
    .select({
      id: entries.id,
      topic: conversations.topic,
      kind: entries.kind,
      text: sql<string>`${entries.body}->>'text'`,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .innerJoin(conversations, eq(conversations.id, entries.conversationId))
    .where(
      and(
        eq(conversations.userId, userId),
        inArray(entries.kind, SPOKEN_KINDS),
        sql`${entries.body}->>'text' ilike ${`%${needle.replace(/[\\%_]/g, '\\$&')}%`}`,
      ),
    )
    .orderBy(desc(entries.createdAt), desc(entries.seq))
    .limit(limit);
