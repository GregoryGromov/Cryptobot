import {
  HORIZONS,
  type Horizon,
  horizonSchema,
  probabilitiesSchema,
  tradePlanSchema,
} from '@reinforce/harness-contract';
import { z } from 'zod';
import type { Probabilities } from './scoring.js';

/**
 * How far the model has written a forecast, read off what it has streamed: the odds of the four horizons, the trade,
 * why. Before its first word it is reading the market it was given.
 */
export type Progress = {
  readonly stage: 'reading' | 'odds' | 'plan' | 'reasons';
  /** The horizons written in full, in the order written: their odds, expected move and range, in percent. */
  readonly odds: readonly {
    readonly horizon: Horizon;
    readonly probabilities: Probabilities;
    readonly expected: number;
    readonly q10: number;
    readonly q50: number;
    readonly q90: number;
  }[];
  readonly plan: { readonly action: 'LONG' | 'SHORT' | 'FLAT'; readonly horizon: Horizon } | null;
  /** The call in one sentence, then why, as far as each is written. */
  readonly headline: string | null;
  readonly thesis: string | null;
};

export const READING: Progress = { stage: 'reading', odds: [], plan: null, headline: null, thesis: null };

const rangeSchema = z.object({
  expectedReturnPct: z.number(),
  quantiles: z.object({ q10: z.number(), q50: z.number(), q90: z.number() }),
});

const writtenText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const fields = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const progressOf = (partial: unknown): Progress => {
  const forecast = fields(partial);
  // The model writes one part at a time, in whatever order: a part is whole once it has gone on to the next.
  const writing = forecast ? Object.keys(forecast).at(-1) : undefined;
  const horizons = Array.isArray(forecast?.horizons) ? (forecast.horizons as unknown[]) : [];
  const whole = writing === 'horizons' ? horizons.slice(0, -1) : horizons;
  const odds = whole.flatMap((written) => {
    const horizon = horizonSchema.safeParse(fields(written)?.horizon);
    const probabilities = probabilitiesSchema.safeParse(fields(written)?.probabilities);
    const range = rangeSchema.safeParse(written);
    return horizon.success && probabilities.success && range.success
      ? [
          {
            horizon: horizon.data,
            probabilities: probabilities.data,
            expected: range.data.expectedReturnPct,
            ...range.data.quantiles,
          },
        ]
      : [];
  });
  const trade = writing === 'trade' ? null : tradePlanSchema.safeParse(forecast?.trade);
  const plan = trade?.success ? { action: trade.data.action, horizon: trade.data.horizon } : null;
  const rationale = fields(forecast?.rationale);
  const begun = horizons.length > 0 || forecast?.trade !== undefined || rationale !== null;
  // The steps are told in the order a person reads a forecast: the odds, the trade, then why.
  const stage = !begun
    ? 'reading'
    : odds.length < HORIZONS.length
      ? 'odds'
      : plan === null
        ? 'plan'
        : 'reasons';
  return {
    stage,
    odds,
    plan,
    headline: writtenText(rationale?.headline),
    thesis: writtenText(rationale?.thesis),
  };
};
