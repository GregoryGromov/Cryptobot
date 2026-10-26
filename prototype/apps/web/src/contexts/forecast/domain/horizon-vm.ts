import type { Cls, ForecastNote, Horizon, HorizonNote } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { type HorizonStatus, horizonStatus } from './episode-vm';
import { probabilityOf, tenthsOf } from './verdict';

type OutcomeRange =
  | { readonly kind: 'below'; readonly price: number }
  | { readonly kind: 'between'; readonly lo: number; readonly hi: number }
  | { readonly kind: 'above'; readonly price: number };

export type OutcomeColumn = {
  readonly cls: Cls;
  readonly tenths: number;
  readonly lead: boolean;
  readonly landed: boolean;
  readonly range: OutcomeRange | null;
};

export type HorizonDetail = {
  readonly horizon: Horizon;
  readonly checkAt: number;
  readonly traded: boolean;
  readonly status: HorizonStatus;
  readonly outcomes: readonly OutcomeColumn[];
  readonly expected: { readonly price: number; readonly lo: number; readonly hi: number } | null;
  readonly note: string | null;
};

const ORDER = ['DOWN', 'FLAT', 'UP'] as const;

const shareOf = (h: HorizonNote, cls: Cls): number => probabilityOf(h.probs, cls);

const rangeOf = (cls: Cls, p0: number | null, tau: number): OutcomeRange | null => {
  if (p0 === null) return null;
  const lo = p0 * (1 - tau / 100);
  const hi = p0 * (1 + tau / 100);
  return match(cls)
    .with('DOWN', (): OutcomeRange => ({ kind: 'below', price: lo }))
    .with('UP', (): OutcomeRange => ({ kind: 'above', price: hi }))
    .with('FLAT', (): OutcomeRange => ({ kind: 'between', lo, hi }))
    .exhaustive();
};

export const priceAt = (p0: number, pct: number): number => p0 * (1 + pct / 100);

export const outcomesOf = (p0: number | null, h: HorizonNote): readonly OutcomeColumn[] => {
  const top = Math.max(...ORDER.map((cls) => tenthsOf(shareOf(h, cls))));
  const landed = h.checked?.cls ?? null;
  return ORDER.map((cls) => ({
    cls,
    tenths: tenthsOf(shareOf(h, cls)),
    lead: tenthsOf(shareOf(h, cls)) === top,
    landed: landed === cls,
    range: rangeOf(cls, p0, h.tau),
  }));
};

export const horizonDetail = (
  forecast: Pick<ForecastNote, 'p0' | 'plan'>,
  h: HorizonNote,
  now: number,
): HorizonDetail => {
  const { p0 } = forecast;
  return {
    horizon: h.horizon,
    checkAt: h.checkAt,
    traded: forecast.plan.action !== 'FLAT' && forecast.plan.horizon === h.horizon,
    status: horizonStatus(h, now),
    outcomes: outcomesOf(p0, h),
    expected:
      p0 === null ? null : { price: priceAt(p0, h.expected), lo: priceAt(p0, h.q10), hi: priceAt(p0, h.q90) },
    note: h.note,
  };
};
