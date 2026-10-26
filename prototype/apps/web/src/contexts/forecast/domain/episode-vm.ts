import type { Candle, Cls, ForecastNote, Horizon, HorizonNote } from '@reinforce/server/dto';
import { match, P } from 'ts-pattern';
import { type CheckMark, checkMark, type Lean, leanOf, tenthsOf } from './verdict';

export const MINUTE = 60_000;
const FORECAST_SPAN_MINUTES = 60;

export const spanMinutes = (forecast: Pick<ForecastNote, 'horizons'>): number =>
  forecast.horizons.reduce((span, h) => Math.max(span, h.horizon), 0) || FORECAST_SPAN_MINUTES;

export const onTerm = <F extends Pick<ForecastNote, 'horizons'>>(forecast: F, term: Horizon): F =>
  forecast.horizons.some((h) => h.horizon === term)
    ? { ...forecast, horizons: forecast.horizons.filter((h) => h.horizon === term) }
    : forecast;

export type HorizonStatus =
  | { readonly kind: 'waiting'; readonly at: number }
  | { readonly kind: 'checking'; readonly at: number }
  | {
      readonly kind: 'checked';
      readonly returnPct: number;
      readonly outcome: Cls | null;
      readonly mark: CheckMark;
    }
  | { readonly kind: 'no-prices' }
  | { readonly kind: 'unscored' };

export const horizonStatus = (h: HorizonNote, now: number): HorizonStatus =>
  match(h)
    .with({ checkStatus: 'resolved', checked: P.nonNullable }, ({ checked }) => ({
      kind: 'checked' as const,
      returnPct: checked.returnPct,
      outcome: checked.cls,
      mark: checkMark(leanOf(h.probs)?.cls ?? null, checked.cls),
    }))
    .with({ checkStatus: 'unresolved-data-quality' }, () => ({ kind: 'no-prices' as const }))
    .with({ checkStatus: 'not-prospective' }, () => ({ kind: 'unscored' as const }))
    .with({ checkStatus: P.union('waiting', 'pending-evaluation', 'resolved') }, () =>
      h.checkAt > now
        ? { kind: 'waiting' as const, at: h.checkAt }
        : { kind: 'checking' as const, at: h.checkAt },
    )
    .exhaustive();

export type StripCell = {
  readonly horizon: Horizon;
  readonly lean: Lean;
  readonly top: number;
  readonly status: HorizonStatus;
  readonly traded: boolean;
};

const topTenths = (h: HorizonNote): number =>
  Math.max(tenthsOf(h.probs.p_up), tenthsOf(h.probs.p_flat), tenthsOf(h.probs.p_down));

export const stripOf = (forecast: Pick<ForecastNote, 'horizons' | 'plan'>, now: number): StripCell[] =>
  [...forecast.horizons]
    .sort((a, b) => a.horizon - b.horizon)
    .map((h) => ({
      horizon: h.horizon,
      lean: leanOf(h.probs),
      top: topTenths(h),
      status: horizonStatus(h, now),
      traded: forecast.plan.action !== 'FLAT' && forecast.plan.horizon === h.horizon,
    }));

export type Stance = 'up' | 'down' | 'flat';

const stanceOfCls = (cls: Cls): Stance =>
  match(cls)
    .with('UP', () => 'up' as const)
    .with('DOWN', () => 'down' as const)
    .with('FLAT', () => 'flat' as const)
    .exhaustive();

export const planHorizonOf = (forecast: Pick<ForecastNote, 'horizons' | 'plan'>): HorizonNote | null =>
  forecast.horizons.find((h) => h.horizon === forecast.plan.horizon) ?? forecast.horizons[0] ?? null;

export const stanceOf = (forecast: Pick<ForecastNote, 'horizons' | 'plan'>): Stance | null => {
  const h = planHorizonOf(forecast);
  const lean = h ? leanOf(h.probs) : null;
  return lean ? stanceOfCls(lean.cls) : null;
};

export type PointTally =
  | { readonly kind: 'leaning'; readonly backing: number; readonly against: number; readonly risks: number }
  | { readonly kind: 'open'; readonly points: number; readonly risks: number };

export const pointTally = (forecast: Pick<ForecastNote, 'horizons' | 'plan' | 'points'>): PointTally => {
  const main = stanceOf(forecast);
  const risks = forecast.points.filter((p) => p.stance === 'risk').length;
  if (main === null) return { kind: 'open', points: forecast.points.length - risks, risks };
  const backing = forecast.points.filter((p) => p.stance === main).length;
  return { kind: 'leaning', backing, against: forecast.points.length - backing - risks, risks };
};

export type Progress =
  | { readonly kind: 'next'; readonly at: number }
  | { readonly kind: 'checking'; readonly at: number }
  | { readonly kind: 'done'; readonly hits: number; readonly n: number }
  | { readonly kind: 'hit' }
  | { readonly kind: 'miss' }
  | { readonly kind: 'over' };

type StatusOf<K extends HorizonStatus['kind']> = Extract<HorizonStatus, { kind: K }>;

const isStatus =
  <K extends HorizonStatus['kind']>(kind: K) =>
  (status: HorizonStatus): status is StatusOf<K> =>
    status.kind === kind;

export const progressOf = (forecast: Pick<ForecastNote, 'horizons' | 'plan'>, now: number): Progress => {
  const statuses = stripOf(forecast, now).map((c) => c.status);
  const waiting = statuses.find(isStatus('waiting'));
  if (waiting) return { kind: 'next', at: waiting.at };
  const checking = statuses.find(isStatus('checking'));
  if (checking) return { kind: 'checking', at: checking.at };
  const scored = statuses.filter(isStatus('checked')).filter((s) => s.mark !== 'none');
  if (scored.length === 0) return { kind: 'over' };
  const hits = scored.filter((s) => s.mark === 'hit').length;
  if (statuses.length === 1) return hits === 1 ? { kind: 'hit' } : { kind: 'miss' };
  return { kind: 'done', hits, n: scored.length };
};

export const isLive = (forecast: Pick<ForecastNote, 'horizons'>): boolean =>
  forecast.horizons.some((h) => h.checkStatus === 'waiting' || h.checkStatus === 'pending-evaluation');

const isOfficial = (forecast: Pick<ForecastNote, 'cohort'>): boolean => forecast.cohort === 'official';

const lastClose = (candles: readonly Candle[], from: number, now: number): number | null =>
  candles.filter((c) => c.t >= from && c.t + MINUTE <= now).at(-1)?.c ?? null;

export const invalidationCrossed = (
  forecast: Pick<ForecastNote, 'invalidation' | 't0' | 'horizons'>,
  candles: readonly Candle[],
  now: number,
): boolean => {
  const level = forecast.invalidation;
  if (level === null || now >= forecast.t0 + spanMinutes(forecast) * MINUTE) return false;
  const last = lastClose(candles, forecast.t0, now);
  if (last === null) return false;
  return match(level.when)
    .with('below', () => last < level.price)
    .with('above', () => last > level.price)
    .exhaustive();
};

export const recordOf = (
  record: {
    readonly official: readonly { horizon: Horizon; n: number; provisional: boolean; skill: number | null }[];
    readonly onDemand: readonly { horizon: Horizon; n: number; provisional: boolean; skill: number | null }[];
  } | null,
  forecast: Pick<ForecastNote, 'cohort' | 'plan'>,
) => {
  if (record === null) return null;
  const rows = isOfficial(forecast) ? record.official : record.onDemand;
  return rows.find((r) => r.horizon === forecast.plan.horizon) ?? null;
};
