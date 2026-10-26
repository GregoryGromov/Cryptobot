import type { Candle, ForecastNote, Horizon, HorizonNote } from '@reinforce/server/dto';

export const T0 = Date.UTC(2026, 9, 9, 12, 0);
const MINUTE = 60_000;

const HORIZONS = [5, 15, 30, 60] as const satisfies readonly Horizon[];

export const horizonNote = (horizon: Horizon, over: Partial<HorizonNote> = {}): HorizonNote => ({
  horizon,
  probs: { p_up: 0.6, p_flat: 0.25, p_down: 0.15 },
  expected: 0.2,
  q10: -0.3,
  q50: 0.2,
  q90: 0.7,
  tau: 0.1,
  checkAt: T0 + horizon * MINUTE,
  checkStatus: 'waiting',
  checked: null,
  note: null,
  ...over,
});

export const forecastNote = (over: Partial<ForecastNote> = {}): ForecastNote => ({
  id: 'f1',
  threadId: 'th1',
  coin: 'BTC',
  at: T0 - 30_000,
  t0: T0,
  p0: 100,
  cohort: 'official',
  version: 3,
  headline: 'Рывок продолжится',
  thesis: 'Объём втрое выше обычного, рынок идёт следом.',
  horizons: HORIZONS.map((h) => horizonNote(h)),
  plan: { action: 'LONG', horizon: 15, sizePct: 5, stopPct: 0.8, targetPct: 1.2 },
  points: [
    { stance: 'up', weight: 'high' },
    { stance: 'up', weight: 'medium' },
    { stance: 'down', weight: 'low' },
    { stance: 'risk', weight: 'low' },
  ],
  invalidation: { when: 'below', level: 'low_120m', price: 99.2 },
  mark: null,
  ...over,
});

export const candle = (minutesFromT0: number, close: number, over: Partial<Candle> = {}): Candle => ({
  t: T0 + minutesFromT0 * MINUTE,
  o: close,
  h: close + 0.1,
  l: close - 0.1,
  c: close,
  v: 10,
  ...over,
});
