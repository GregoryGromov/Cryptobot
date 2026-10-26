import type { Candle } from '@reinforce/harness-contract';
import { MINUTE, minuteFloor } from '../kernel/time.js';
import * as market from '../modules/market/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { canonical, sha256 } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from '../workflows/deps.js';

const instruments = [
  { instrument: 'BTC', base: 60000 },
  { instrument: 'ETH', base: 3000 },
  { instrument: 'SOL', base: 100 },
  { instrument: 'xyz:GOLD', base: 2000 },
];
const level = (base: number, minute: number) =>
  base * (1 + Math.sin(minute / 17) * 0.007 + Math.sin(minute / 5) * 0.003);
export function replayCandles(instrument: string, base: number, end: number, count = 120): Candle[] {
  return Array.from({ length: count }, (_, i) => {
    const openAt = end - (count - i) * MINUTE;
    const minute = openAt / MINUTE;
    const open = level(base, minute);
    const close = level(base, minute + 1);
    return {
      instrument,
      openAt,
      open: open.toFixed(8),
      high: (Math.max(open, close) * 1.0005).toFixed(8),
      low: (Math.min(open, close) * 0.9995).toFixed(8),
      close: close.toFixed(8),
      volume: '1000',
      revision: 'synthetic-v1',
    };
  });
}
/** Causal synthetic fixture stream. The snapshot never contains an unclosed/future candle. */
export async function pollReplayMarket(deps: Deps) {
  if (deps.config.MARKET_MODE !== 'replay') throw new Error('Replay requires explicit market mode');
  const now = deps.clock.now();
  const availableThrough = minuteFloor(now);
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'market-poll', 'replay');
    const previous = await market.loadCursor(tx, 'replay');
    if (previous && Number(previous) >= availableThrough) return { kind: 'unchanged' } as const;
    // Bound every transaction, but keep the cursor at the last actually persisted minute.
    const end = previous ? Math.min(availableThrough, Number(previous) + 60 * MINUTE) : availableThrough;
    const minutes = previous ? (end - Number(previous)) / MINUTE : 0;
    const snapshotEnds = new Set([end]);
    for (let at = Number(previous) + MINUTE; previous && at <= end; at += MINUTE)
      if (at % (5 * MINUTE) === 0) snapshotEnds.add(at);
    for (const { instrument, base } of instruments) {
      await market.recordCandles(tx, replayCandles(instrument, base, end, 120 + minutes), now);
      for (const cutoff of [...snapshotEnds].sort((a, b) => a - b)) {
        const candles = replayCandles(instrument, base, cutoff);
        const latest = candles.at(-1)!;
        const body = {
          instrument,
          environment: 'synthetic-replay',
          cutoffAt: cutoff,
          price: { close: latest.close },
          candles,
        };
        const raw = canonical(body);
        const inputHash = sha256(raw);
        const snapshotId = `replay:${inputHash}`;
        await market.recordSnapshot(tx, {
          id: snapshotId,
          instrument,
          cutoffAt: cutoff,
          inputHash,
          raw,
          body,
          receivedAt: now,
          quality: 'valid',
        });
        if (cutoff % (5 * MINUTE) === 0) {
          const eventId = `replay:${instrument}:${cutoff}`;
          const movePct = (Number(latest.close) / Number(candles.at(-6)!.close) - 1) * 100;
          const fresh = await market.recordEvent(tx, {
            id: eventId,
            instrument,
            snapshotId,
            barEnd: cutoff,
            receivedAt: now,
            body: { movePct, horizon: 5, volumeConfirmed: false, scope: 'UNKNOWN', synthetic: true },
          });
          if (fresh) await enqueue(deps.jobs, tx, 'market.dispatch', eventId);
        }
      }
    }
    await market.setCursor(tx, 'replay', String(end), now);
    return { kind: 'updated', through: end } as const;
  });
}
