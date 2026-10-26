// What the broker sees of the markets when asked. Without it the model has nothing to answer «what is notable now?»
// from, asks the person for the data, or calls a market it is asked about missing when it is only quiet.

import { marketHours, type Venue } from '../kernel/market-hours.js';
import { D } from '../kernel/money.js';
import { MINUTE, minuteFloor } from '../kernel/time.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { usesHttpMarket } from '../platform/config.js';
import type { Deps } from './deps.js';

/** How far back a signal or the broker's own forecast still counts as what is going on now. */
const RECENT = 120 * MINUTE;
/** At most this many markets, the conversation's own and the watched ones first: every question carries them all. */
const MARKETS = 60;
const SIGNALS = 10;

const ticker = (coin: string): string => coin.replace(/^xyz:/, '');

/** The market of `coins` a model names by the ticker the brief shows, with or without its dollar sign. */
export const coinNamed = (coins: readonly string[], name: string): string | undefined => {
  const wanted = name.replace(/^\$/, '').toUpperCase();
  return coins.find((coin) => ticker(coin).toUpperCase() === wanted || coin.toUpperCase() === wanted);
};

const EXCHANGES: Record<Venue, string> = { us: 'NYSE/Nasdaq', krx: 'KRX', cme: 'CME' };

/** A moment as the person's clock shows it, weekday first, so the model need not work the calendar out. */
export const wallClock = (timezone: string, at: number): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

const hoursOf = (coin: string, now: number, timezone: string) => {
  const hours = marketHours(coin, now);
  if (!hours) return null;
  const exchange = EXCHANGES[hours.venue];
  return hours.open
    ? { exchange, open: true, closes: wallClock(timezone, hours.closesAt) }
    : { exchange, open: false, opens: wallClock(timezone, hours.opensAt) };
};

/**
 * Prices with their moves over 15 minutes and an hour, the signals and the broker's forecasts of the last two hours. A
 * market without a trade in the last hour stays in, priceless, so that it reads as quiet rather than unknown.
 */
export async function marketBrief(
  deps: Deps,
  brokerId: string,
  watched: readonly string[],
  own: string | null,
  timezone: string,
) {
  const now = deps.clock.now();
  const until = minuteFloor(now);
  const snapshots = await market.latestSnapshots(deps.db);
  const source = usesHttpMarket(deps.config) ? await market.loadCatalog(deps.db) : undefined;
  const universe =
    source?.body.instruments.filter((i) => i.in_universe).map((i) => i.exchange_symbol) ??
    snapshots.map((s) => s.instrument);
  const coins = [...new Set([...(own ? [own] : []), ...watched, ...universe])].slice(0, MARKETS);
  const quotes = await Promise.all(
    coins.map(async (coin) => {
      // Upstream stores candles minutes late: the moves are counted back from the latest candle.
      const candles = (
        await market.loadCandles(deps.db, coin, until - 61 * MINUTE - market.LIVE_STATE_AGE, until)
      ).map((r) => r.candle);
      const last = candles.at(-1);
      const move = (minutes: number): number | null => {
        const from = last && candles.find((c) => c.openAt === last.openAt - minutes * MINUTE);
        return from && last ? Number(new D(last.close).div(from.close).minus(1).mul(100).toFixed(2)) : null;
      };
      return {
        market: ticker(coin),
        watched: watched.includes(coin),
        price: last ? Number(last.close) : null,
        change15mPct: move(15),
        change1hPct: move(60),
        hours: hoursOf(coin, now, timezone),
      };
    }),
  );
  const signals = (await market.listEvents(deps.db, 50))
    .filter((e) => e.barEnd <= now && now - e.barEnd <= RECENT && typeof e.body.movePct === 'number')
    .slice(0, SIGNALS)
    .map((e) => ({
      market: ticker(e.instrument),
      at: e.barEnd,
      movePct: e.body.movePct,
      horizonMin: e.body.horizon,
      scope: e.body.scope ?? null,
      volumeConfirmed: e.body.volumeConfirmed === true,
      timesUsual: typeof e.body.times === 'number' ? e.body.times : null,
    }));
  const [dispatches, submissions] = await Promise.all([
    forecast.listDispatches(deps.db, brokerId),
    forecast.listBrokerForecasts(deps.db, brokerId),
  ]);
  const byId = new Map(dispatches.map((d) => [d.id, d]));
  const forecasts = new Map<string, unknown>();
  // The forecasts come newest first: the first one of a market is its latest.
  for (const f of submissions) {
    if (now - f.receivedAt > RECENT) break;
    const d = byId.get(f.dispatchId);
    if (!d || forecasts.has(d.instrument)) continue;
    const plan = f.body.trade;
    forecasts.set(d.instrument, {
      market: ticker(d.instrument),
      at: f.receivedAt,
      action: plan.action,
      horizonMin: plan.horizon,
      probabilities: f.body.horizons.find((h) => h.horizon === plan.horizon)?.probabilities ?? null,
    });
  }
  return {
    coins,
    brief: {
      asOf: until,
      now: wallClock(timezone, now),
      timezone,
      quotes,
      signals,
      forecasts: [...forecasts.values()],
    },
  };
}
