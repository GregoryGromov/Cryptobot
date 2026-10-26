import { exchangeSymbol, snapshotCandles } from '../adapters/atp-signal.js';
import { MINUTE } from '../kernel/time.js';
import * as market from '../modules/market/index.js';
import { usesHttpMarket } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { canonical, sha256 } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import { logger } from '../platform/log.js';
import type { Deps } from './deps.js';

const FEED = 'atp-events';
// While the feed stays down it is told again this often, so an outage shows in the logs without a line per retry.
const DOWN_TOLD_EVERY = 5 * MINUTE;

type Followed =
  | Awaited<ReturnType<typeof followEvents>>
  | { readonly kind: 'failed'; readonly reason: string };
type FeedNote = {
  readonly level: 'warn' | 'info';
  readonly msg: string;
  readonly fields: Record<string, unknown>;
};

/**
 * Watches the reads of the feed: says when it goes down and why, again every `DOWN_TOLD_EVERY` while it stays down,
 * and when it comes back after how long. A conflict is another reader moving the cursor first, not a failure.
 */
export function feedWatch() {
  let down: { since: number; reason: string; told: number } | null = null;
  return (result: Followed, now: number): FeedNote | null => {
    if (result.kind === 'conflict') return null;
    const reason =
      result.kind === 'unavailable' || result.kind === 'failed'
        ? result.reason
        : result.kind === 'invalid-page'
          ? 'invalid-page'
          : null;
    if (reason === null) {
      if (!down) return null;
      const was = down;
      down = null;
      return {
        level: 'info',
        msg: 'market-feed-restored',
        fields: { reason: was.reason, downMs: now - was.since },
      };
    }
    if (down && now - down.told < DOWN_TOLD_EVERY) return null;
    down = { since: down?.since ?? now, reason, told: now };
    return { level: 'warn', msg: 'market-feed-down', fields: { reason, downMs: now - down.since } };
  };
}

/**
 * One read of the upstream event feed from the stored cursor, long-polling `waitMs` when caught up. The page, its
 * snapshots and the next cursor are written in one transaction; a replayed page is absorbed by `event_id`.
 */
export async function followEvents(deps: Deps, waitMs: number) {
  const source = deps.marketSource;
  if (!usesHttpMarket(deps.config) || !source) throw new Error('HTTP market source required');
  const cursor = await market.loadCursor(deps.db, FEED);
  const response = await source.events(cursor || null, waitMs, deps.shutdown);
  if (response.kind === 'failed') {
    if (response.reason !== 'cursor-lost') return { kind: 'unavailable', reason: response.reason } as const;
    // The feed no longer holds what followed the cursor. Those events are gone upstream: note the gap and
    // continue from the feed's floor, where already recorded events deduplicate.
    logger.warn({ cursor }, 'market-feed-gap');
    await inTransaction(deps.db, async (tx) => {
      await lock(tx, 'market-poll', FEED);
      if ((await market.loadCursor(tx, FEED)) === cursor)
        await market.setCursor(tx, FEED, '', deps.clock.now());
    });
    return { kind: 'gap' } as const;
  }
  const page = response.value;
  const now = deps.clock.now();
  // An event ahead of our clock holds the whole page, so the cursor never passes an unrecorded event.
  if (page.events.some((e) => e.detected_at_ms > now)) return { kind: 'invalid-page' } as const;
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-poll', FEED);
    if ((await market.loadCursor(tx, FEED)) !== cursor) return { kind: 'conflict' } as const;
    for (const item of page.events) {
      const instrument = exchangeSymbol(item.instrument_id);
      const raw = canonical(item.state);
      const previous = (await market.latestSnapshots(tx)).find((s) => s.instrument === instrument);
      await market.recordSnapshot(tx, {
        id: item.market_state_id,
        instrument,
        cutoffAt: item.detected_at_ms,
        inputHash: sha256(raw),
        raw,
        body: item.state,
        receivedAt: now,
        quality: item.state.data_quality.valid ? 'valid' : 'insufficient-history',
      });
      // The state carries its last two hours from upstream's journal, ahead of its candle storage: the signal's
      // price line needs no wait. An older state must not bring back a minute corrected since.
      if (!previous || item.detected_at_ms >= previous.cutoffAt)
        await market.recordCandles(tx, snapshotCandles(item.state), now);
      const detected = item.event.event;
      const primary = item.event.horizons[String(detected.primary_horizon_minutes)];
      // `available_at_ms` is left out: upstream drops it for events restored after a restart, and the body is a fact.
      const fresh = await market.recordEvent(tx, {
        id: item.event_id,
        instrument,
        snapshotId: item.market_state_id,
        barEnd: item.detected_at_ms,
        receivedAt: now,
        body: {
          movePct: typeof primary?.simple_return === 'number' ? primary.simple_return * 100 : null,
          horizon: detected.primary_horizon_minutes,
          scope: detected.event_scope,
          volumeConfirmed: detected.volume_confirmed,
          times: primary?.shock_multiple ?? null,
          event: item.event,
        },
      });
      // An event first seen past its forecast deadline (a feed read from its floor) is kept but not dispatched.
      if (fresh && now < item.detected_at_ms + MINUTE - 1000)
        await enqueue(deps.jobs, tx, 'market.dispatch', item.event_id);
    }
    await market.setCursor(tx, FEED, page.next_cursor, now);
    return { kind: 'updated', events: page.events.length, more: page.has_more } as const;
  });
}
