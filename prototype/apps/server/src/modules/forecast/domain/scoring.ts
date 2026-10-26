import type { ForecastSubmission, Horizon } from '@reinforce/harness-contract';
import { z } from 'zod';
import { D } from '../../../kernel/money.js';

export const scoringRulesSchema = z.strictObject({
  version: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9][a-z0-9._-]*$/),
  algorithm: z.literal('scoring-v1'),
  neutralPct: z.strictObject({
    5: z.number().min(0).max(100),
    15: z.number().min(0).max(100),
    30: z.number().min(0).max(100),
    60: z.number().min(0).max(100),
  }),
  provisionalBelow: z.number().int().min(1).max(1000000),
});
export type ScoringRules = z.infer<typeof scoringRulesSchema>;
export const SCORING_RULES: ScoringRules = {
  version: 'scoring-1-provisional',
  algorithm: 'scoring-v1',
  neutralPct: { 5: 0.1, 15: 0.2, 30: 0.3, 60: 0.4 } satisfies Record<Horizon, number>,
  provisionalBelow: 30,
};
export type Probabilities = { up: number; flat: number; down: number };
export type Score = {
  horizon: Horizon;
  returnPct: number;
  outcome: keyof Probabilities;
  brier: number;
  absoluteReturnError: number;
  pinball: { q10: number; q50: number; q90: number };
  covered: boolean;
  referenceBrier: number | null;
};
export function brier(p: Probabilities, outcome: keyof Probabilities): number {
  return (['up', 'flat', 'down'] as const).reduce(
    (sum, key) => sum + (p[key] - Number(key === outcome)) ** 2,
    0,
  );
}
export const pinball = (actual: number, estimate: number, quantile: number): number =>
  Math.max(quantile * (actual - estimate), (quantile - 1) * (actual - estimate));

export function scoreForecast(
  forecast: ForecastSubmission['horizons'][number],
  p0: string,
  ph: string,
  reference: Probabilities | null,
  rules: ScoringRules = SCORING_RULES,
): Score {
  const ret = new D(ph).div(p0).minus(1).mul(100).toNumber();
  const band = rules.neutralPct[forecast.horizon];
  const outcome = ret > band ? 'up' : ret < -band ? 'down' : 'flat';
  const { q10, q50, q90 } = forecast.quantiles;
  return {
    horizon: forecast.horizon,
    returnPct: ret,
    outcome,
    brier: brier(forecast.probabilities, outcome),
    absoluteReturnError: Math.abs(forecast.expectedReturnPct - ret),
    pinball: { q10: pinball(ret, q10, 0.1), q50: pinball(ret, q50, 0.5), q90: pinball(ret, q90, 0.9) },
    covered: ret >= q10 && ret <= q90,
    referenceBrier: reference ? brier(reference, outcome) : null,
  };
}
export function brierSkill(scores: readonly Score[]): number | null {
  const paired = scores.filter((score) => score.referenceBrier !== null);
  const reference = paired.reduce((sum, score) => sum + (score.referenceBrier ?? 0), 0);
  return paired.length && reference > 0
    ? 1 - paired.reduce((sum, score) => sum + score.brier, 0) / reference
    : null;
}
