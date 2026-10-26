export type ChartCandle = {
  readonly t: number;
  readonly o: number;
  readonly h: number;
  readonly l: number;
  readonly c: number;
  readonly v: number;
};

export type MarketRead = {
  /** The closes of the hour `hour` is measured over, the price line drawn beside it. */
  readonly closes: readonly number[];
  /** Percent over the last sixty minutes. */
  readonly hour: number | null;
  /** The last five minutes' volume against the window's usual minute. */
  readonly volume: number | null;
  readonly rsi: number | null;
  /** High to low over the window, in percent of the last close. */
  readonly range: number | null;
};

const RSI_PERIOD = 14;
const RECENT = 5;
const MINUTE = 60_000;

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

/** Wilder's relative strength over the closes; null without a full period. */
export const rsiOf = (closes: readonly number[]): number | null => {
  if (closes.length <= RSI_PERIOD) return null;
  const moves = closes.slice(1).map((close, index) => close - (closes[index] ?? close));
  let gain = mean(moves.slice(0, RSI_PERIOD).map((move) => Math.max(move, 0)));
  let loss = mean(moves.slice(0, RSI_PERIOD).map((move) => Math.max(-move, 0)));
  for (const move of moves.slice(RSI_PERIOD)) {
    gain = (gain * (RSI_PERIOD - 1) + Math.max(move, 0)) / RSI_PERIOD;
    loss = (loss * (RSI_PERIOD - 1) + Math.max(-move, 0)) / RSI_PERIOD;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
};

/** What the candles of a market show at a glance, as the broker reads them. */
export const marketRead = (candles: readonly ChartCandle[]): MarketRead => {
  const last = candles.at(-1);
  if (!last) return { closes: [], hour: null, volume: null, rsi: null, range: null };
  const closes = candles.map((candle) => candle.c);
  const before = candles.findLast((candle) => candle.t <= last.t - 60 * MINUTE);
  const usual = mean(candles.map((candle) => candle.v));
  const recent = candles.slice(-RECENT);
  const high = Math.max(...candles.map((candle) => candle.h));
  const low = Math.min(...candles.map((candle) => candle.l));
  return {
    closes: before ? candles.filter((candle) => candle.t >= before.t).map((candle) => candle.c) : closes,
    hour: before ? (last.c / before.c - 1) * 100 : null,
    volume: candles.length > RECENT * 2 && usual > 0 ? mean(recent.map((candle) => candle.v)) / usual : null,
    rsi: rsiOf(closes),
    range: last.c > 0 ? ((high - low) / last.c) * 100 : null,
  };
};
