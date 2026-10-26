import type { Candle, ForecastNote, Horizon } from '@reinforce/server/dto';
import { fittedTicks, linearScale, type PlotFrame } from '@reinforce/ui-primitives/charts';
import { MINUTE, spanMinutes } from './episode-vm';
import { priceAt } from './horizon-vm';

export const FAN = {
  top: 12,
  plot: 184,
  axis: 24,
  padLeft: 2,
  gutter: 56,
  historyMinutes: 30,
  narrowBelow: 520,
  historyShare: { narrow: 0.38, wide: 0.42 },
  candleFill: 0.62,
  minSpanShare: 0.002,
  tickCount: 4,
} as const;

export type FanInput = {
  readonly forecast: Pick<ForecastNote, 't0' | 'p0' | 'horizons'>;
  readonly candles: readonly Candle[];
  readonly now: number;
  readonly width: number;
};

export type FanPoint = {
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly price: number;
  readonly since: number | null;
};

type FanBar = {
  readonly key: number;
  readonly x: number;
  readonly width: number;
  readonly top: number;
  readonly bottom: number;
  readonly high: number;
  readonly low: number;
  readonly up: boolean;
};

type FanHorizon = {
  readonly horizon: Horizon;
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly price: number;
  readonly lo: number;
  readonly hi: number;
};

export type FanGeometry = {
  readonly width: number;
  readonly height: number;
  readonly plotTop: number;
  readonly plotBottom: number;
  readonly plotRight: number;
  readonly t0X: number;
  readonly t0: number;
  readonly start: number;
  readonly p0: number;
  readonly ticks: readonly { readonly value: number; readonly y: number }[];
  readonly digits: number;
  readonly lo: number;
  readonly hi: number;
  readonly observed: { readonly lo: number; readonly hi: number } | null;
  readonly bars: readonly FanBar[];
  readonly corridor: string;
  readonly expected: string;
  readonly after: string | null;
  readonly horizons: readonly FanHorizon[];
  readonly points: readonly FanPoint[];
  readonly frame: PlotFrame;
  readonly origin: FanPoint;
  readonly last: FanPoint;
  readonly live: boolean;
};

const MAX_DIGITS = 6;

export const tickDigits = (ticks: readonly number[]): number => {
  const [a, b] = ticks;
  if (a === undefined || b === undefined) return 0;
  const step = String(Number(Math.abs(b - a).toFixed(10)));
  return Math.min(MAX_DIGITS, step.split('.')[1]?.length ?? 0);
};

const pathOf = (points: readonly (readonly [number, number])[]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

export const historyOf = (candles: readonly Candle[], t0: number): Candle[] =>
  candles.filter((c) => c.t + MINUTE <= t0).slice(-FAN.historyMinutes);

export const fanGeometry = ({ forecast, candles, now, width }: FanInput): FanGeometry | null => {
  const { t0 } = forecast;
  const history = historyOf(candles, t0);
  const p0 = forecast.p0 ?? history.at(-1)?.c ?? null;
  if (p0 === null || width <= 0) return null;

  const plotTop = FAN.top;
  const plotBottom = FAN.top + FAN.plot;
  const plotLeft = FAN.padLeft;
  const plotRight = Math.max(width - FAN.gutter, plotLeft + 1);
  const share = width < FAN.narrowBelow ? FAN.historyShare.narrow : FAN.historyShare.wide;
  const historyWidth = (plotRight - plotLeft) * share;
  const t0X = plotLeft + historyWidth;
  const futureWidth = plotRight - t0X;
  const start = t0 - FAN.historyMinutes * MINUTE;
  const hx = (at: number) => plotLeft + ((at - start) / (FAN.historyMinutes * MINUTE)) * historyWidth;
  const span = spanMinutes(forecast);
  const fx = (minutes: number) => t0X + Math.sqrt(Math.min(Math.max(minutes, 0), span) / span) * futureWidth;

  const end = Math.min(now, t0 + span * MINUTE);
  const realized = candles.filter((c) => c.t >= t0 && c.t + MINUTE <= end);
  const horizons = [...forecast.horizons].sort((a, b) => a.horizon - b.horizon);
  const knots = [
    { minutes: 0, lo: p0, mid: p0, hi: p0 },
    ...horizons.map((h) => ({
      minutes: h.horizon,
      lo: priceAt(p0, h.q10),
      mid: priceAt(p0, h.expected),
      hi: priceAt(p0, h.q90),
    })),
  ];

  const observed = [...history.flatMap((c) => [c.h, c.l]), ...realized.map((c) => c.c)];
  const seen = [...observed, ...knots.flatMap((k) => [k.lo, k.mid, k.hi])];
  const lo = Math.min(...seen);
  const hi = Math.max(...seen);
  const axis = fittedTicks({ lo, hi, count: FAN.tickCount, minSpan: p0 * FAN.minSpanShare });
  const y = linearScale(axis.domain, [plotBottom, plotTop]);

  const slot = historyWidth / FAN.historyMinutes;
  const bars = history.map((c) => ({
    key: c.t,
    x: hx(c.t + MINUTE / 2),
    width: Math.max(1, slot * FAN.candleFill),
    top: y(Math.max(c.o, c.c)),
    bottom: y(Math.min(c.o, c.c)),
    high: y(c.h),
    low: y(c.l),
    up: c.c >= c.o,
  }));

  const before: FanPoint[] = history.map((c) => ({
    x: hx(c.t + MINUTE / 2),
    y: y(c.c),
    at: c.t + MINUTE,
    price: c.c,
    since: null,
  }));
  const after: FanPoint[] = realized.map((c) => ({
    x: fx((c.t + MINUTE - t0) / MINUTE),
    y: y(c.c),
    at: c.t + MINUTE,
    price: c.c,
    since: (c.c / p0 - 1) * 100,
  }));
  const origin: FanPoint = { x: t0X, y: y(p0), at: t0, price: p0, since: 0 };

  return {
    width,
    height: plotBottom + FAN.axis,
    plotTop,
    plotBottom,
    plotRight,
    t0X,
    t0,
    start,
    p0,
    ticks: axis.ticks.map((value) => ({ value, y: y(value) })),
    digits: tickDigits(axis.ticks),
    lo,
    hi,
    observed: observed.length ? { lo: Math.min(...observed), hi: Math.max(...observed) } : null,
    bars,
    corridor: `${pathOf([
      ...knots.map((k) => [fx(k.minutes), y(k.hi)] as const),
      ...knots.toReversed().map((k) => [fx(k.minutes), y(k.lo)] as const),
    ])}Z`,
    expected: pathOf(knots.map((k) => [fx(k.minutes), y(k.mid)] as const)),
    after: after.length ? pathOf([origin, ...after].map((p) => [p.x, p.y] as const)) : null,
    horizons: horizons.map((h) => ({
      horizon: h.horizon,
      x: fx(h.horizon),
      y: y(priceAt(p0, h.expected)),
      at: h.checkAt,
      price: priceAt(p0, h.expected),
      lo: priceAt(p0, h.q10),
      hi: priceAt(p0, h.q90),
    })),
    points: [...before, ...after],
    frame: { width, padLeft: plotLeft, padRight: width - plotRight },
    origin,
    last: after.at(-1) ?? origin,
    live: now < t0 + span * MINUTE,
  };
};
