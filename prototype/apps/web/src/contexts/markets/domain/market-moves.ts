import type { Candle, MarketList } from '@reinforce/server/dto';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type MovePeriod = 'hour' | 'hours4' | 'day' | 'week';

export type PeriodMove = { readonly period: MovePeriod; readonly change: number };

export const DAY = 24 * HOUR;

/** How far a market went over `span` to its last candle's close, in percent; null when its candles do not reach back. */
export function moveOver(candles: readonly Candle[], span: number): number | null {
  const last = candles.at(-1);
  if (!last) return null;
  const base = candles.findLast((c) => c.t <= last.t - span);
  return base && base.c !== 0 ? (last.c / base.c - 1) * 100 : null;
}

/** The market's moves to now over each period: up to a day from its 5-minute candles, over a week from hourly ones. */
export function periodMoves(fiveMinute: readonly Candle[], hourly: readonly Candle[]): readonly PeriodMove[] {
  const moves: readonly [MovePeriod, number | null][] = [
    ['hour', moveOver(fiveMinute, HOUR)],
    ['hours4', moveOver(fiveMinute, 4 * HOUR)],
    ['day', moveOver(fiveMinute, DAY)],
    ['week', moveOver(hourly, 7 * DAY)],
  ];
  return moves.flatMap(([period, change]) => (change === null ? [] : [{ period, change }]));
}

export const MOST_COMPARED = 3;

/** Markets to compare one with before the person picks: the first two others of its class. */
export function defaultPeers(list: MarketList, coin: string): readonly string[] {
  const group = list.find((g) => g.markets.some((m) => m.coin === coin));
  return (group?.markets ?? [])
    .filter((m) => m.coin !== coin)
    .slice(0, 2)
    .map((m) => m.coin);
}

/** The markets compared after adding one: never the market itself, twice, or more than three. */
export const withPeer = (peers: readonly string[], coin: string, own: string): readonly string[] =>
  coin === own || peers.includes(coin) || peers.length >= MOST_COMPARED ? peers : [...peers, coin];
