import type { Candle } from '@reinforce/server/dto';

export const INDICATORS = ['vwap', 'bands', 'volume', 'rsi'] as const;

export type Indicator = (typeof INDICATORS)[number];

export type Point = { readonly t: number; readonly value: number };

export type Bands = { readonly upper: readonly Point[]; readonly lower: readonly Point[] };

const HOUR = 60 * 60_000;
const BAND_BARS = 20;
const BAND_WIDTH = 2;
const RSI_BARS = 14;
const USUAL_BARS = 48;
const LOUD = 2;
// An hour's average price needs a few candles inside the hour to mean anything.
const FEWEST_VWAP_BARS = 4;

/** Candles of a frame that make the hour the detector averages its price over; null when the frame is an hour or more. */
export function vwapBars(frameMs: number): number | null {
  const bars = Math.round(HOUR / frameMs);
  return bars >= FEWEST_VWAP_BARS ? bars : null;
}

/** The average price over the last `bars` candles, each candle's typical price weighted by what it traded. */
export function vwapLine(candles: readonly Candle[], bars: number): readonly Point[] {
  const out: Point[] = [];
  let weighted = 0;
  let traded = 0;
  candles.forEach((c, i) => {
    weighted += ((c.h + c.l + c.c) / 3) * c.v;
    traded += c.v;
    const gone = candles[i - bars];
    if (gone) {
      weighted -= ((gone.h + gone.l + gone.c) / 3) * gone.v;
      traded -= gone.v;
    }
    if (i >= bars - 1 && traded > 0) out.push({ t: c.t, value: weighted / traded });
  });
  return out;
}

/** The usual spread of the closes: 20 candles' mean, two standard deviations above and below it. */
export function bandLines(candles: readonly Candle[]): Bands {
  const upper: Point[] = [];
  const lower: Point[] = [];
  for (let i = BAND_BARS - 1; i < candles.length; i++) {
    const closes = candles.slice(i - BAND_BARS + 1, i + 1).map((c) => c.c);
    const mean = closes.reduce((a, b) => a + b, 0) / BAND_BARS;
    const spread = Math.sqrt(closes.reduce((a, b) => a + (b - mean) ** 2, 0) / BAND_BARS);
    const t = candles[i]?.t ?? 0;
    upper.push({ t, value: mean + BAND_WIDTH * spread });
    lower.push({ t, value: mean - BAND_WIDTH * spread });
  }
  return { upper, lower };
}

/** RSI over 14 candles with Wilder's smoothing, as the detector reads it. */
export function rsiLine(candles: readonly Candle[]): readonly Point[] {
  const out: Point[] = [];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < candles.length; i++) {
    const change = (candles[i]?.c ?? 0) - (candles[i - 1]?.c ?? 0);
    const up = Math.max(change, 0);
    const down = Math.max(-change, 0);
    if (i <= RSI_BARS) {
      gain += up / RSI_BARS;
      loss += down / RSI_BARS;
      if (i < RSI_BARS) continue;
    } else {
      gain = (gain * (RSI_BARS - 1) + up) / RSI_BARS;
      loss = (loss * (RSI_BARS - 1) + down) / RSI_BARS;
    }
    out.push({ t: candles[i]?.t ?? 0, value: loss === 0 ? 100 : 100 - 100 / (1 + gain / loss) });
  }
  return out;
}

/** Candles that traded at least twice their usual: the mean of the 48 before them. */
export function loudCandles(candles: readonly Candle[]): ReadonlySet<number> {
  const loud = new Set<number>();
  let traded = 0;
  candles.forEach((c, i) => {
    if (i >= USUAL_BARS && c.v >= (LOUD * traded) / USUAL_BARS && traded > 0) loud.add(c.t);
    traded += c.v;
    const gone = candles[i - USUAL_BARS];
    if (gone) traded -= gone.v;
  });
  return loud;
}

/** The indicators drawn with the candles, each null when not shown; `loud` holds the candles traded twice their usual. */
export type IndicatorLines = {
  readonly vwap: readonly Point[] | null;
  readonly bands: Bands | null;
  readonly loud: ReadonlySet<number> | null;
  readonly rsi: readonly Point[] | null;
};

/** What the chart draws for the indicators shown; null when none is. */
export function indicatorLines(
  candles: readonly Candle[],
  shown: readonly Indicator[],
  hourBars: number | null,
): IndicatorLines | null {
  if (shown.length === 0) return null;
  return {
    vwap: shown.includes('vwap') && hourBars !== null ? vwapLine(candles, hourBars) : null,
    bands: shown.includes('bands') ? bandLines(candles) : null,
    loud: shown.includes('volume') ? loudCandles(candles) : null,
    rsi: shown.includes('rsi') ? rsiLine(candles) : null,
  };
}
