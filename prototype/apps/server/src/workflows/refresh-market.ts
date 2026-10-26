import { setTimeout as sleep } from 'node:timers/promises';
import { exchangeSymbol, snapshotCandles } from '../adapters/atp-signal.js';
import { MINUTE, minuteFloor } from '../kernel/time.js';
import * as broker from '../modules/broker/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { usesHttpMarket } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { canonical, newId, sha256 } from '../platform/identity.js';
import type { Deps } from './deps.js';

// The upstream defaults to two ClickHouse slots. This limit includes API-triggered reads
// and is shared across every Reinforce process. No network call runs under a DB lock.
// Candle reads take one of them at a time, so a computed state that a person waits on finds the other.
async function claim(deps: Deps, key: string, candles = false) {
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-refresh', 'capacity');
    const now = deps.clock.now();
    const prior = await market.loadRefresh(tx, key);
    const active = await market.activeRefreshes(tx, now);
    if (
      (prior && (prior.nextAt > now || prior.leaseUntil > now)) ||
      active.length >= 2 ||
      (candles && active.some((a) => a.key.startsWith('candles:')))
    )
      return null;
    const lease: market.Refresh = {
      key,
      observationId: prior?.observationId ?? null,
      nextAt: prior?.nextAt ?? 0,
      leaseId: newId(),
      leaseUntil: now + 20000,
    };
    await market.saveRefresh(tx, lease);
    return lease;
  });
}

/** `patience`: how long a person's request waits for a busy slot, or for another process reading the same market. */
export async function refreshMarket(deps: Deps, requestedInstrument: string, patience = 0) {
  if (!usesHttpMarket(deps.config) || !deps.marketSource) return;
  const instrument = exchangeSymbol(requestedInstrument);
  const key = `instrument:${instrument}`;
  let lease = await claim(deps, key);
  for (let tries = Math.ceil(patience / 250); !lease && tries > 0 && !deps.shutdown?.aborted; tries--) {
    const prior = await market.loadRefresh(deps.db, key);
    const now = deps.clock.now();
    // Read within this minute: the current observation stands.
    if (prior && prior.nextAt > now && prior.leaseUntil <= now) return;
    await sleep(250);
    lease = await claim(deps, key);
  }
  if (!lease) return;
  const result = await deps.marketSource.current(instrument, deps.shutdown);
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-refresh', 'capacity');
    const now = deps.clock.now();
    const current = await market.loadRefresh(tx, key);
    if (current?.leaseId !== lease.leaseId || current.leaseUntil <= now) return;
    const observation: market.Observation = {
      id: newId(),
      instrument,
      snapshotId: null,
      status: 'ERROR',
      reasons: [],
      rawResponse: null,
      receivedAt: now,
    };
    if (result.kind === 'failed') observation.reasons = [result.reason];
    else {
      const value = result.value;
      observation.rawResponse = value.rawResponse;
      if (value.data_time_ms !== null && value.data_time_ms > minuteFloor(now)) {
        observation.reasons = ['future-snapshot'];
      } else {
        observation.status = value.status;
        observation.reasons = value.reasons;
        if (value.state && value.data_time_ms !== null) {
          // Canonical state bytes are frozen once. The changing HTTP wrapper is retained above.
          const raw = canonical(value.state);
          observation.snapshotId = value.state.market_state_id;
          await market.recordSnapshot(tx, {
            id: value.state.market_state_id,
            instrument,
            cutoffAt: value.data_time_ms,
            inputHash: sha256(raw),
            raw,
            body: value.state,
            receivedAt: now,
            quality: value.state.data_quality.valid ? 'valid' : 'insufficient-history',
          });
          // The state's last minute is the reference price of a manual order, so it is stored with the state.
          // An older state must not bring back a minute corrected since; a range read reaches the same revisions.
          const previous = (await market.latestSnapshots(tx)).find((s) => s.instrument === instrument);
          if (!previous || value.data_time_ms >= previous.cutoffAt)
            await market.recordCandles(tx, snapshotCandles(value.state), now);
        }
      }
    }
    await market.recordObservation(tx, observation);
    await market.saveRefresh(tx, {
      ...lease,
      observationId: observation.id,
      leaseId: null,
      leaseUntil: 0,
      // One refresh per market per minute. Errors back off, including malformed replies.
      nextAt: observation.status === 'ERROR' ? now + 15000 : minuteFloor(now) + MINUTE,
    });
  });
}

// Upstream rewrites minutes after late corrections and REST repairs, so every read covers the last two hours
// again. A longer outage is caught up from the last served minute.
const CANDLE_REVISIT = 120 * MINUTE;
const CANDLE_CATCH_UP = 1440 * MINUTE;

export async function refreshCandles(deps: Deps, requestedInstrument: string) {
  if (!usesHttpMarket(deps.config) || !deps.marketSource) return;
  const instrument = exchangeSymbol(requestedInstrument);
  const key = `candles:${instrument}`;
  const lease = await claim(deps, key, true);
  if (!lease) return;
  const to = minuteFloor(deps.clock.now());
  const readUntil = Number((await market.loadCursor(deps.db, key)) || to - CANDLE_REVISIT);
  const from = Math.max(to - CANDLE_CATCH_UP, Math.min(readUntil, to - CANDLE_REVISIT));
  const result = await deps.marketSource.candles(instrument, from, to, deps.shutdown);
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-refresh', 'capacity');
    const now = deps.clock.now();
    const current = await market.loadRefresh(tx, key);
    if (current?.leaseId !== lease.leaseId || current.leaseUntil <= now) return;
    const end = result.kind === 'ok' ? (result.value.served?.to_ms ?? null) : null;
    if (result.kind === 'ok') await market.recordCandles(tx, result.value.candles, now);
    if (end !== null && end > readUntil) await market.setCursor(tx, key, String(end), now);
    await market.saveRefresh(tx, {
      ...lease,
      leaseId: null,
      leaseUntil: 0,
      // The minute that just closed reaches upstream storage seconds later: retry it soon, then wait a minute.
      nextAt: result.kind === 'failed' ? now + 15000 : end === to ? to + MINUTE : now + 5000,
    });
  });
}

// How far back the exchange fills a market that atp-signal left behind; older minutes are atp's to bring.
const EXCHANGE_FILL = 15 * MINUTE;
// A closed minute settles on the exchange within a second or two.
const EXCHANGE_SETTLE = 2000;

/**
 * The exchange's own minutes for a market that someone is acting on, while atp-signal has not stored them: upstream
 * storage runs minutes behind, and an order cannot fill, a position close or a forecast resolve on a missing minute.
 */
export async function fillRecentCandles(deps: Deps, requestedInstrument: string) {
  if (!deps.exchangeCandles) return;
  const instrument = exchangeSymbol(requestedInstrument);
  const key = `exchange:${instrument}`;
  const now = deps.clock.now();
  const to = minuteFloor(now);
  if (now - to < EXCHANGE_SETTLE) return;
  const prior = await market.loadRefresh(deps.db, key);
  if (prior && prior.nextAt > now) return;
  const latest = (await market.loadCandles(deps.db, instrument, to - EXCHANGE_FILL, to)).at(-1)?.candle;
  let got = latest?.openAt === to - MINUTE;
  if (!got) {
    const from = latest ? latest.openAt + MINUTE : to - EXCHANGE_FILL;
    const candles = await deps.exchangeCandles.closed(instrument, from, to, deps.shutdown);
    if (candles?.length) await inTransaction(deps.db, (tx) => market.recordCandles(tx, candles, now));
    // A minute without trades has no candle: ask again within the minute, then wait for the next one.
    got = candles !== null && (candles.some((c) => c.openAt === to - MINUTE) || now - to > 20000);
  }
  // Not a lease: these reads leave atp-signal's slots alone.
  await inTransaction(deps.db, (tx) =>
    market.saveRefresh(tx, {
      key,
      observationId: null,
      nextAt: got ? to + MINUTE + EXCHANGE_SETTLE : now + 10000,
      leaseId: null,
      leaseUntil: 0,
    }),
  );
}

export async function refreshCatalog(deps: Deps) {
  if (!usesHttpMarket(deps.config) || !deps.marketSource) return;
  const lease = await claim(deps, 'catalog');
  if (!lease) return;
  const result = await deps.marketSource.catalog(deps.shutdown);
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-refresh', 'capacity');
    const now = deps.clock.now();
    const current = await market.loadRefresh(tx, 'catalog');
    if (current?.leaseId !== lease.leaseId || current.leaseUntil <= now) return;
    if (result.kind === 'ok') await market.saveCatalog(tx, result.value, now);
    await market.saveRefresh(tx, {
      ...lease,
      leaseId: null,
      leaseUntil: 0,
      nextAt: now + (result.kind === 'ok' ? MINUTE : 15000),
    });
  });
}

/** Polling only ingests data; pg-boss continues to own forecasts and execution. Events come by the feed. */
export async function pollHttpMarket(deps: Deps) {
  if (!usesHttpMarket(deps.config)) throw new Error('HTTP market source required');
  await refreshCatalog(deps);
  const universe = ((await market.loadCatalog(deps.db))?.body.instruments ?? [])
    .filter((row) => row.in_universe)
    .map((row) => row.exchange_symbol);
  // Agents, forecasts and orders read the computed state, one upstream calculation per market and minute.
  // Every market of the universe is on show and needs only its candles, which are a cheap read.
  const stated = new Set<string>();
  // The demo serves a handful of recorded markets and computes them all.
  if (deps.config.REPLAY_SOURCE === 'atp-demo') for (const instrument of universe) stated.add(instrument);
  for (const personal of await broker.listBrokers(deps.db)) {
    const head = await broker.loadHead(deps.db, personal.id);
    for (const instrument of head.preferences.markets) stated.add(exchangeSymbol(instrument));
  }
  for (const row of await forecast.pendingMarketInstruments(deps.db))
    stated.add(exchangeSymbol(row.instrument));
  for (const row of await trading.pendingMarketInstruments(deps.db))
    stated.add(exchangeSymbol(row.instrument));
  const waiting = await market.waitingRefreshes(deps.db, deps.clock.now());
  for (const instrument of stated) {
    if (deps.shutdown?.aborted) break;
    if (!waiting.has(`exchange:${instrument}`)) await fillRecentCandles(deps, instrument);
  }
  const queue = [...stated];
  await Promise.all(
    [0, 1].map(async () => {
      for (let instrument = queue.shift(); instrument && !deps.shutdown?.aborted; instrument = queue.shift())
        if (!waiting.has(`instrument:${instrument}`)) await refreshMarket(deps, instrument);
    }),
  );
  // One candle read at a time: the other slot stays free for a state a person asks for.
  for (const instrument of new Set([...stated, ...universe])) {
    if (deps.shutdown?.aborted) break;
    if (!waiting.has(`candles:${instrument}`)) await refreshCandles(deps, instrument);
  }
}
