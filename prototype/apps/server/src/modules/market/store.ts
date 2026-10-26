import { type Candle, candleSchema } from '@reinforce/harness-contract';
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, or, sql } from 'drizzle-orm';
import { MINUTE } from '../../kernel/time.js';
import type { Db, Tx } from '../../platform/db.js';
import { canonical, newId } from '../../platform/identity.js';
import { candles, catalog, cursors, events, observations, refreshes, snapshots } from './schema.js';
export type Snapshot = typeof snapshots.$inferSelect;
export type MarketEvent = typeof events.$inferSelect;
export type Observation = typeof observations.$inferSelect;
export type Refresh = typeof refreshes.$inferSelect;
export async function operationalMetrics(db: Db) {
  const [summary] = await db
    .select({
      events: sql<number>`count(*)::int`,
      delaySum: sql<number>`coalesce(sum(greatest(0, ${events.receivedAt} - ${events.barEnd})), 0)::float8 / 1000`,
      delayMax: sql<number>`coalesce(max(greatest(0, ${events.receivedAt} - ${events.barEnd})), 0)::float8 / 1000`,
    })
    .from(events);
  const quality = await db
    .select({ status: observations.status, count: sql<number>`count(*)::int` })
    .from(refreshes)
    .innerJoin(observations, eq(refreshes.observationId, observations.id))
    .groupBy(observations.status);
  return { summary: summary!, quality };
}
export async function loadRefresh(db: Db, key: string) {
  const [row] = await db.select().from(refreshes).where(eq(refreshes.key, key));
  return row;
}
export async function saveRefresh(tx: Tx, value: Refresh) {
  await tx.insert(refreshes).values(value).onConflictDoUpdate({ target: refreshes.key, set: value });
}
export const activeRefreshes = (db: Db, now: number) =>
  db.select().from(refreshes).where(gt(refreshes.leaseUntil, now));
/** Keys that are not due yet: read once per tick, so a market waiting for its minute costs no transaction. */
export async function waitingRefreshes(db: Db, now: number) {
  const rows = await db
    .select({ key: refreshes.key })
    .from(refreshes)
    .where(or(gt(refreshes.nextAt, now), gt(refreshes.leaseUntil, now)));
  return new Set(rows.map((row) => row.key));
}
export async function recordObservation(tx: Tx, value: Observation) {
  await tx.insert(observations).values(value);
}
export async function currentObservations(db: Db) {
  return db
    .select({ observation: observations })
    .from(refreshes)
    .innerJoin(observations, eq(refreshes.observationId, observations.id))
    .then((rows) => rows.map((row) => row.observation));
}
/**
 * Upstream ClickHouse takes candles from its queue in batches minutes apart, so a state often lacks its latest bars.
 * One that lacks only a few of them still serves; the model sees its data time.
 */
const LAGGING_BARS = 8;
/** The oldest state served live: the lagging bars, the minute in progress and the read. */
export const LIVE_STATE_AGE = (LAGGING_BARS + 2) * MINUTE;
function lagging(observation: Observation) {
  if (observation.status !== 'STALE' || observation.reasons.some((r) => r !== 'MISSING_LATEST_BARS'))
    return false;
  try {
    const missing: unknown = JSON.parse(observation.rawResponse ?? '')?.freshness?.missing_latest_bars;
    return typeof missing === 'number' && Number.isInteger(missing) && missing > 0 && missing <= LAGGING_BARS;
  } catch {
    return false;
  }
}
/** A computed state checked within the last minute that can be acted on. */
export function usableObservation(observation: Observation, now: number) {
  return (
    (observation.status === 'OK' || lagging(observation)) &&
    !!observation.snapshotId &&
    now - observation.receivedAt < MINUTE &&
    observation.receivedAt <= now
  );
}
/** Upstream could not compute the market's state: too few contiguous minutes, as on a thinly traded market. */
export async function thinMarket(db: Db, instrument: string) {
  const [row] = await db
    .select({ status: observations.status })
    .from(refreshes)
    .innerJoin(observations, eq(refreshes.observationId, observations.id))
    .where(eq(refreshes.key, `instrument:${instrument}`));
  return row?.status === 'INSUFFICIENT_HISTORY';
}
export async function currentSnapshot(db: Db, instrument: string, now: number, live: boolean) {
  let snapshot: Snapshot | undefined;
  if (live) {
    const [row] = await db
      .select({ observation: observations })
      .from(refreshes)
      .innerJoin(observations, eq(refreshes.observationId, observations.id))
      .where(eq(refreshes.key, `instrument:${instrument}`));
    const observation = row?.observation;
    if (!observation?.snapshotId || !usableObservation(observation, now)) return undefined;
    snapshot = await findSnapshot(db, observation.snapshotId);
  } else {
    const [row] = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.instrument, instrument))
      .orderBy(desc(snapshots.cutoffAt), desc(snapshots.receivedAt))
      .limit(1);
    snapshot = row;
  }
  return snapshot?.quality === 'valid' &&
    snapshot.cutoffAt <= now &&
    now - snapshot.cutoffAt <= (live ? LIVE_STATE_AGE : 3 * MINUTE)
    ? snapshot
    : undefined;
}
export async function loadCatalog(db: Db) {
  const [row] = await db.select().from(catalog).where(eq(catalog.id, 'atp-signal'));
  return row;
}
export async function saveCatalog(tx: Tx, body: (typeof catalog.$inferSelect)['body'], receivedAt: number) {
  await tx
    .insert(catalog)
    .values({ id: 'atp-signal', body, receivedAt })
    .onConflictDoUpdate({ target: catalog.id, set: { body, receivedAt } });
}
/** The instruments the market overview lists: every one with a snapshot, and the live catalog's. */
export async function knownInstrument(db: Db, instrument: string, live: boolean) {
  const [snapshot] = await db
    .select({ id: snapshots.id })
    .from(snapshots)
    .where(eq(snapshots.instrument, instrument))
    .limit(1);
  if (snapshot) return true;
  return (
    live && Boolean((await loadCatalog(db))?.body.instruments.some((i) => i.exchange_symbol === instrument))
  );
}
export const latestSnapshots = (db: Db) =>
  db
    .selectDistinctOn([snapshots.instrument])
    .from(snapshots)
    .orderBy(asc(snapshots.instrument), desc(snapshots.cutoffAt), desc(snapshots.receivedAt));
export async function findSnapshot(db: Db, id: string) {
  const [row] = await db.select().from(snapshots).where(eq(snapshots.id, id));
  return row;
}
export async function recordSnapshot(tx: Tx, snapshot: Snapshot) {
  await tx.insert(snapshots).values(snapshot).onConflictDoNothing();
  const stored = await findSnapshot(tx, snapshot.id);
  if (
    stored?.inputHash !== snapshot.inputHash ||
    stored.raw !== snapshot.raw ||
    stored.instrument !== snapshot.instrument ||
    stored.cutoffAt !== snapshot.cutoffAt ||
    stored.quality !== snapshot.quality
  ) {
    throw new Error('Upstream attempted to change an immutable snapshot');
  }
}
export async function recordEvent(tx: Tx, event: MarketEvent): Promise<boolean> {
  const rows = await tx.insert(events).values(event).onConflictDoNothing().returning();
  const stored = await findEvent(tx, event.id);
  if (
    !stored ||
    stored.snapshotId !== event.snapshotId ||
    stored.instrument !== event.instrument ||
    stored.barEnd !== event.barEnd ||
    canonical(stored.body) !== canonical(event.body)
  ) {
    throw new Error('Upstream attempted to change an immutable event');
  }
  return rows.length > 0;
}
export async function findEvent(db: Db, id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  return row;
}
export const listEvents = (db: Db, limit = 100) =>
  db.select().from(events).orderBy(desc(events.barEnd)).limit(limit);
export async function loadCursor(db: Db, source: string): Promise<string> {
  const [row] = await db.select().from(cursors).where(eq(cursors.source, source));
  return row?.cursor ?? '';
}
export async function setCursor(tx: Tx, source: string, cursor: string, at: number) {
  await tx
    .insert(cursors)
    .values({ source, cursor, updatedAt: at })
    .onConflictDoUpdate({ target: cursors.source, set: { cursor, updatedAt: at } });
}
function toCandle(row: typeof candles.$inferSelect) {
  return {
    id: row.id,
    candle: candleSchema.parse({
      instrument: row.instrument,
      openAt: row.openAt,
      revision: row.revision,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }),
  };
}
export async function recordCandles(tx: Tx, input: readonly Candle[], receivedAt: number) {
  const parsed = input.map((raw) => candleSchema.parse(raw));
  for (const instrument of new Set(parsed.map((c) => c.instrument))) {
    const batch = parsed.filter((c) => c.instrument === instrument);
    await tx
      .insert(candles)
      .values(batch.map((candle) => ({ id: newId(), ...candle, receivedAt })))
      .onConflictDoNothing();
    const stored = new Map(
      (
        await tx
          .select()
          .from(candles)
          .where(
            and(
              eq(candles.instrument, instrument),
              inArray(candles.openAt, [...new Set(batch.map((c) => c.openAt))]),
              inArray(candles.revision, [...new Set(batch.map((c) => c.revision))]),
            ),
          )
      ).map((row) => [`${row.openAt}:${row.revision}`, toCandle(row).candle]),
    );
    for (const candle of batch) {
      const prior = stored.get(`${candle.openAt}:${candle.revision}`);
      if (!prior || canonical(prior) !== canonical(candle))
        throw new Error('Candle revision changed its contents');
    }
  }
}
export async function findCandle(db: Db, instrument: string, openAt: number) {
  const [row] = await db
    .select()
    .from(candles)
    .where(and(eq(candles.instrument, instrument), eq(candles.openAt, openAt)))
    .orderBy(desc(candles.receivedAt), desc(candles.id))
    .limit(1);
  return row ? toCandle(row) : undefined;
}
export async function findCandleById(db: Db, id: string) {
  const [row] = await db.select().from(candles).where(eq(candles.id, id));
  return row ? toCandle(row) : undefined;
}
export async function findCandlesByIds(db: Db, ids: string[]) {
  if (!ids.length) return [];
  return (await db.select().from(candles).where(inArray(candles.id, ids))).map(toCandle);
}
export async function loadCandles(db: Db, instrument: string, from: number, to: number) {
  const rows = await db
    .selectDistinctOn([candles.openAt])
    .from(candles)
    .where(and(eq(candles.instrument, instrument), gte(candles.openAt, from), lt(candles.openAt, to)))
    .orderBy(asc(candles.openAt), desc(candles.receivedAt), desc(candles.id));
  return rows.map(toCandle);
}

/** Each market's minutes opened in `[from, to)`, folded: when its first and last stored, its first open, last close, traded dollars. */
export async function minuteTotals(db: Db, instruments: readonly string[], from: number, to: number) {
  if (!instruments.length) return [];
  const latest = db
    .selectDistinctOn([candles.instrument, candles.openAt], {
      instrument: candles.instrument,
      openAt: candles.openAt,
      open: candles.open,
      close: candles.close,
      volume: candles.volume,
    })
    .from(candles)
    .where(
      and(inArray(candles.instrument, [...instruments]), gte(candles.openAt, from), lt(candles.openAt, to)),
    )
    .orderBy(asc(candles.instrument), asc(candles.openAt), desc(candles.receivedAt), desc(candles.id))
    .as('latest');
  return db
    .select({
      instrument: latest.instrument,
      firstAt: sql<number>`min(${latest.openAt})::float8`,
      lastAt: sql<number>`max(${latest.openAt})::float8`,
      open: sql<string>`(array_agg(${latest.open} order by ${latest.openAt}))[1]`,
      close: sql<string>`(array_agg(${latest.close} order by ${latest.openAt} desc))[1]`,
      traded: sql<string>`sum(${latest.volume} * ${latest.close})`,
    })
    .from(latest)
    .groupBy(latest.instrument);
}

export async function loadCandlesAsOf(
  db: Db,
  instrument: string,
  from: number,
  to: number,
  receivedBy: number,
) {
  const rows = await db
    .selectDistinctOn([candles.openAt])
    .from(candles)
    .where(
      and(
        eq(candles.instrument, instrument),
        gte(candles.openAt, from),
        lt(candles.openAt, to),
        lte(candles.receivedAt, receivedBy),
      ),
    )
    .orderBy(asc(candles.openAt), desc(candles.receivedAt), desc(candles.id));
  return rows.map(toCandle);
}
