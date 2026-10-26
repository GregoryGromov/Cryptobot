import type { Candle, ForecastNote } from '@reinforce/server/dto';
import { MINUTE, spanMinutes } from './episode-vm';
import { priceAt } from './horizon-vm';

export const SIGNAL_FRAMES = ['1m', '5m', '15m', '1h'] as const;
export type SignalFrame = (typeof SIGNAL_FRAMES)[number];

const FRAME_STEP: Readonly<Record<SignalFrame, number>> = {
  '1m': MINUTE,
  '5m': 5 * MINUTE,
  '15m': 15 * MINUTE,
  '1h': 60 * MINUTE,
};

export type CorridorKnot = {
  readonly at: number;
  readonly lo: number;
  readonly mid: number;
  readonly hi: number;
};

export type ChartLevels = { readonly stop: number; readonly entry: number; readonly take: number };

const SAMPLES = 8;

type End = { readonly minutes: number; readonly lo: number; readonly mid: number; readonly hi: number };

const between = (a: End, b: End, share: number): Omit<End, 'minutes'> => ({
  lo: a.lo + (b.lo - a.lo) * share,
  mid: a.mid + (b.mid - a.mid) * share,
  hi: a.hi + (b.hi - a.hi) * share,
});

/** The range the forecast expects, from its price at t0 out to each horizon; the first stretch widens as the root of time. */
export const corridorKnots = (
  forecast: Pick<ForecastNote, 't0' | 'p0' | 'horizons'>,
  lastClose: number | null,
): readonly CorridorKnot[] => {
  const p0 = forecast.p0 ?? lastClose;
  if (p0 === null || forecast.horizons.length === 0) return [];
  const ends: End[] = [
    { minutes: 0, lo: p0, mid: p0, hi: p0 },
    ...[...forecast.horizons]
      .sort((a, b) => a.horizon - b.horizon)
      .map((h) => ({
        minutes: h.horizon,
        lo: priceAt(p0, h.q10),
        mid: priceAt(p0, h.expected),
        hi: priceAt(p0, h.q90),
      })),
  ];
  const knots: CorridorKnot[] = [{ at: forecast.t0, lo: p0, mid: p0, hi: p0 }];
  ends.slice(1).forEach((end, index) => {
    const start = ends[index] ?? end;
    for (let i = 1; i <= SAMPLES; i++) {
      const linear = i / SAMPLES;
      const share = index === 0 ? Math.sqrt(linear) : linear;
      const minutes = start.minutes + (end.minutes - start.minutes) * linear;
      knots.push({ at: forecast.t0 + minutes * MINUTE, ...between(start, end, share) });
    }
  });
  return knots;
};

export const forecastEnd = (forecast: Pick<ForecastNote, 't0' | 'horizons'>): number =>
  forecast.t0 + spanMinutes(forecast) * MINUTE;

export const frameFloor = (at: number, frame: SignalFrame): number =>
  Math.floor(at / FRAME_STEP[frame]) * FRAME_STEP[frame];

/** Empty slots after the last candle up to the end of the forecast, so its range has room to be drawn. */
export const futureSlots = (
  candles: readonly Candle[],
  until: number,
  frame: SignalFrame,
): readonly number[] => {
  const last = candles.at(-1);
  if (!last) return [];
  const step = FRAME_STEP[frame];
  const slots: number[] = [];
  for (let at = last.t + step; at <= frameFloor(until, frame) + step; at += step) slots.push(at);
  return slots;
};

/** Where on the time scale a moment falls: the slot it lies in plus how far into that slot it is. */
export const slotOf = (at: number, frame: SignalFrame): { readonly slot: number; readonly share: number } => {
  const slot = frameFloor(at, frame);
  return { slot, share: (at - slot) / FRAME_STEP[frame] };
};

// The chart library labels time in UTC, so candles are drawn at the wall-clock moment the viewer reads.
export const wallSeconds = (at: number): number =>
  Math.floor(at / 1000) - new Date(at).getTimezoneOffset() * 60;

export const fromWallSeconds = (seconds: number): number => {
  const guess = seconds * 1000;
  return guess + new Date(guess + new Date(guess).getTimezoneOffset() * MINUTE).getTimezoneOffset() * MINUTE;
};

/** What the chart opens on: the forecast's whole range after three times as much before it, at least the given bars. */
export const openingRange = (
  forecast: Pick<ForecastNote, 't0' | 'horizons'>,
  frame: SignalFrame,
  bars: number,
): { readonly from: number; readonly to: number } => {
  const end = forecastEnd(forecast);
  const span = end - forecast.t0;
  const before = Math.max(3 * span, bars * FRAME_STEP[frame] - span);
  return { from: frameFloor(forecast.t0 - before, frame), to: frameFloor(end, frame) + FRAME_STEP[frame] };
};
