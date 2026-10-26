import { match } from 'ts-pattern';
import { DAY_MS } from '~/shared/format/time';

export type EquityPoint = { readonly at: number; readonly cents: number };

export const toCents = (usd: number): number => Math.round(usd * 100);

export const fromCents = (cents: number): number => cents / 100;

export type EquityInput = {
  readonly start: { readonly at: number; readonly nav: number };
  readonly closes: readonly { readonly at: number; readonly pnl: number }[];
  readonly end: { readonly at: number; readonly nav: number } | null;
};

export const equitySeries = ({ start, closes, end }: EquityInput): readonly EquityPoint[] => {
  const points: EquityPoint[] = [{ at: start.at, cents: toCents(start.nav) }];
  let running = toCents(start.nav);
  for (const close of [...closes].sort((a, b) => a.at - b.at)) {
    running += toCents(close.pnl);
    points.push({ at: close.at, cents: running });
  }
  const last = points.at(-1);
  if (end !== null && last !== undefined && end.at >= last.at)
    points.push({ at: end.at, cents: toCents(end.nav) });
  return points;
};

export const PERIODS = ['1d', '7d', '30d', 'all'] as const;

export type Period = (typeof PERIODS)[number];

const periodMs = (period: Period): number =>
  match(period)
    .with('1d', () => DAY_MS)
    .with('7d', () => 7 * DAY_MS)
    .with('30d', () => 30 * DAY_MS)
    .with('all', () => Number.POSITIVE_INFINITY)
    .exhaustive();

export const withinPeriod = (
  series: readonly EquityPoint[],
  period: Period,
  until: number,
): readonly EquityPoint[] => {
  const from = until - periodMs(period);
  const inside = series.filter((point) => point.at >= from);
  const before = series.findLast((point) => point.at < from);
  if (inside.length === 0) return [];
  return before === undefined ? inside : [{ at: from, cents: before.cents }, ...inside];
};

export const stepPoints = (series: readonly EquityPoint[]): readonly EquityPoint[] =>
  series.flatMap((point, index) => {
    const previous = series[index - 1];
    return previous === undefined || previous.cents === point.cents
      ? [point]
      : [{ at: point.at, cents: previous.cents }, point];
  });

export const returnPctOf = (startNav: number, endNav: number): number | null => {
  const start = toCents(startNav);
  return start === 0 ? null : ((toCents(endNav) - start) / start) * 100;
};
