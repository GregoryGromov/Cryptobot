import { type Candle, candleSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { CHART_FRAMES, type ChartFrame, FRAME_MS } from '../kernel/frames.js';
import { D } from '../kernel/money.js';
import { MINUTE } from '../kernel/time.js';
import { boundedText } from '../platform/http.js';
import { canonical, sha256 } from '../platform/identity.js';

// The exchange's own public minutes, the same trades atp-signal collects. They stand in for the minutes atp-signal
// has not stored yet; its candles for those minutes arrive later as later revisions and take over.
const INFO = 'https://api.hyperliquid.xyz/info';
const row = z.object({
  t: z.number().int(),
  T: z.number().int(),
  s: z.string(),
  i: z.enum(CHART_FRAMES),
  o: z.string(),
  h: z.string(),
  l: z.string(),
  c: z.string(),
  v: z.string(),
  n: z.number().int(),
});
/** A candle to draw: numbers, the one in progress included. */
export type ExchangeBar = { t: number; o: number; h: number; l: number; c: number; v: number };
export interface ExchangeCandlesPort {
  /** Closed minutes opened in `[from, to)`; a minute without trades has none. `null` when the exchange did not answer. */
  closed(instrument: string, from: number, to: number, signal?: AbortSignal): Promise<Candle[] | null>;
  /** The exchange's candles of a frame opened in `[from, to)`, at most its last 5000; `null` when it did not answer. */
  bars(
    instrument: string,
    frame: ChartFrame,
    from: number,
    to: number,
    signal?: AbortSignal,
  ): Promise<ExchangeBar[] | null>;
}

export function hyperliquid(fetcher: typeof fetch = fetch): ExchangeCandlesPort {
  async function snapshot(
    instrument: string,
    frame: ChartFrame,
    from: number,
    to: number,
    signal?: AbortSignal,
  ) {
    let raw: string;
    try {
      const response = await fetcher(INFO, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // HIP-3 markets keep their dex prefix (`xyz:NVDA`), as exchange symbols do here.
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: { coin: instrument, interval: frame, startTime: from, endTime: to },
        }),
        redirect: 'error',
        signal: AbortSignal.any([AbortSignal.timeout(8000), ...(signal ? [signal] : [])]),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return null;
      }
      raw = await boundedText(response, 1_000_000);
    } catch {
      return null;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return null;
    }
    const parsed = z.array(row).max(5000).safeParse(json);
    return parsed.success ? parsed.data.filter((r) => r.s === instrument && r.i === frame) : null;
  }
  return {
    async bars(instrument, frame, from, to, signal) {
      const rows = await snapshot(instrument, frame, from, to, signal);
      if (!rows) return null;
      return rows
        .filter((r) => r.t % FRAME_MS[frame] === 0 && r.t >= from && r.t < to)
        .map((r) => ({
          t: r.t,
          o: Number(r.o),
          h: Number(r.h),
          l: Number(r.l),
          c: Number(r.c),
          v: Number(r.v),
        }))
        .filter((bar) => [bar.o, bar.h, bar.l, bar.c, bar.v].every(Number.isFinite));
    },
    async closed(instrument, from, to, signal) {
      const rows = await snapshot(instrument, '1m', from, to, signal);
      if (!rows) return null;
      const candles: Candle[] = [];
      // The minute in progress comes last; only minutes that closed by `to` are facts.
      for (const r of rows) {
        if (r.t % MINUTE !== 0 || r.t < from || r.t + MINUTE > to) continue;
        const body = {
          instrument,
          openAt: r.t,
          open: new D(r.o).toFixed(),
          high: new D(r.h).toFixed(),
          low: new D(r.l).toFixed(),
          close: new D(r.c).toFixed(),
          volume: new D(r.v).toFixed(),
        };
        const candle = candleSchema.safeParse({ ...body, revision: `hl:${sha256(canonical(body))}` });
        if (candle.success) candles.push(candle.data);
      }
      return candles;
    },
  };
}
