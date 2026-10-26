import { z } from 'zod';
import { boundedText } from '../platform/http.js';

const INFO = 'https://api.hyperliquid.xyz/info';
const CACHE_MS = 20_000;

const meta = z.object({ universe: z.array(z.object({ name: z.string() })) });
const context = z.object({
  funding: z.string(),
  openInterest: z.string(),
  prevDayPx: z.string(),
  dayNtlVlm: z.string(),
  markPx: z.string(),
});

/** What the exchange says of a market over its day; the funding is the hourly rate, in percent. */
export type ExchangeStats = {
  funding: number;
  openInterestUsd: number;
  dayVolumeUsd: number;
  dayChange: number;
};
export interface ExchangeStatsPort {
  /** Every market of the dexes the coins trade on, by exchange symbol; a dex that did not answer is left out. */
  stats(coins: readonly string[], signal?: AbortSignal): Promise<ReadonlyMap<string, ExchangeStats>>;
}

const dexOf = (coin: string): string => (coin.includes(':') ? coin.slice(0, coin.indexOf(':')) : '');

export function hyperliquidStats(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): ExchangeStatsPort {
  const cache = new Map<string, { at: number; stats: Promise<Map<string, ExchangeStats> | null> }>();
  async function read(dex: string, signal?: AbortSignal): Promise<Map<string, ExchangeStats> | null> {
    let json: unknown;
    try {
      const response = await fetcher(INFO, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(dex ? { type: 'metaAndAssetCtxs', dex } : { type: 'metaAndAssetCtxs' }),
        redirect: 'error',
        signal: AbortSignal.any([AbortSignal.timeout(8000), ...(signal ? [signal] : [])]),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return null;
      }
      json = JSON.parse(await boundedText(response, 2_000_000));
    } catch {
      return null;
    }
    const parsed = z.tuple([meta, z.array(context)]).safeParse(json);
    if (!parsed.success) return null;
    const [{ universe }, contexts] = parsed.data;
    const out = new Map<string, ExchangeStats>();
    universe.forEach(({ name }, i) => {
      const c = contexts[i];
      if (!c) return;
      const mark = Number(c.markPx);
      const prev = Number(c.prevDayPx);
      const stats = {
        funding: Number(c.funding) * 100,
        openInterestUsd: Number(c.openInterest) * mark,
        dayVolumeUsd: Number(c.dayNtlVlm),
        dayChange: prev > 0 ? (mark / prev - 1) * 100 : Number.NaN,
      };
      if (Object.values(stats).every(Number.isFinite)) out.set(name, stats);
    });
    return out;
  }
  const cached = (dex: string, signal?: AbortSignal) => {
    const at = now();
    const hit = cache.get(dex);
    if (hit && at - hit.at < CACHE_MS) return hit.stats;
    const stats = read(dex, signal);
    cache.set(dex, { at, stats });
    return stats;
  };
  return {
    async stats(coins, signal) {
      const dexes = [...new Set(coins.map(dexOf))];
      const maps = await Promise.all(dexes.map((dex) => cached(dex, signal)));
      return new Map(maps.flatMap((map) => [...(map ?? [])]));
    },
  };
}
