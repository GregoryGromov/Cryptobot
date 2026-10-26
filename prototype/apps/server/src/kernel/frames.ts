import { MINUTE } from './time.js';

export const CHART_FRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export type ChartFrame = (typeof CHART_FRAMES)[number];

export const FRAME_MS: Readonly<Record<ChartFrame, number>> = {
  '1m': MINUTE,
  '5m': 5 * MINUTE,
  '15m': 15 * MINUTE,
  '1h': 60 * MINUTE,
  '4h': 240 * MINUTE,
  '1d': 1440 * MINUTE,
};

/** Candles a chart reads at first, and the most it reads as a person scrolls back: the exchange keeps no more. */
export const CHART_BARS = 1000;
export const MOST_CHART_BARS = 5000;

/** The finest frame that draws `[from, to)` in at most `bars` candles. */
export function frameFor(from: number, to: number, bars: number): ChartFrame {
  return CHART_FRAMES.find((frame) => (to - from) / FRAME_MS[frame] <= bars) ?? '1d';
}
