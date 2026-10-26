import { type ForecastSubmission, versionInputSchema } from '@reinforce/harness-contract';
import type { Locale } from '@reinforce/i18n/server';
import type { z } from 'zod';
import { buildBaseline } from './baseline.js';
import type { MarketFixture } from './fixture.js';
import { brierSkill, type Probabilities, type Score, scoreForecast } from './scoring.js';

export const candidateSchema = versionInputSchema.pick({ prompt: true, model: true });
export type ExperimentDefinition = {
  brokerId: string;
  candidate: z.infer<typeof candidateSchema>;
  /** The owner's language, which the texts of a forecast are written in. */
  language: Locale;
  fixture: MarketFixture;
  harnessVersion: string;
  maxTokens: number;
  modelMode: 'synthetic' | 'platform';
};
export type ExperimentResult = {
  forecast: ForecastSubmission;
  horizons: { horizon: number; score: Score | null }[];
  actualModel: string;
  cost: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
};
export function evaluateCase(value: MarketFixture['cases'][number], prediction: ForecastSubmission) {
  return prediction.horizons.map((h) => {
    const outcome = value.outcomes.find((o) => o.horizon === h.horizon)!;
    const source = value.baselines.find((b) => b.horizon === h.horizon)!;
    const ids = new Set(source.candleIds);
    const baseline = buildBaseline(
      value.history.filter((r) => ids.has(r.id)),
      h.horizon,
      source.cutoff,
      value.rules,
    );
    return {
      horizon: h.horizon,
      score:
        outcome.reference && outcome.outcome
          ? scoreForecast(
              h,
              outcome.reference.candle.close,
              outcome.outcome.candle.close,
              baseline.probabilities,
              value.rules,
            )
          : null,
    };
  });
}
/** Keep every comparison dimension; missing labels and failed calls never become zero scores. */
export function summarizeExperiment(
  fixture: MarketFixture,
  results: { caseId: string; body: ExperimentResult }[],
) {
  const groups = new Map<
    string,
    {
      source: string;
      origin: string;
      sourceCohort: string;
      instrument: string;
      rulesVersion: string;
      horizon: number;
      provisionalBelow: number;
      scores: Score[];
      observations: { probabilities: Probabilities; outcome: keyof Probabilities }[];
      total: number;
    }
  >();
  for (const value of fixture.cases)
    for (const target of value.outcomes) {
      const identity = {
        source: value.source,
        origin: value.origin,
        sourceCohort: value.cohort,
        instrument: value.instrument,
        rulesVersion: value.rules.version,
        horizon: target.horizon,
      };
      const key = JSON.stringify(identity);
      const group = groups.get(key) ?? {
        ...identity,
        provisionalBelow: value.rules.provisionalBelow,
        scores: [],
        observations: [],
        total: 0,
      };
      group.total++;
      const score = results
        .find((r) => r.caseId === value.id)
        ?.body.horizons.find((h) => h.horizon === target.horizon)?.score;
      if (score) {
        group.scores.push(score);
        const probabilities = results
          .find((r) => r.caseId === value.id)!
          .body.forecast.horizons.find((h) => h.horizon === target.horizon)!.probabilities;
        group.observations.push({ probabilities, outcome: score.outcome });
      }
      groups.set(key, group);
    }
  const mean = (values: number[]) =>
    values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
  return [...groups.values()].map(({ scores, observations, provisionalBelow, ...group }) => ({
    ...group,
    n: scores.length,
    unresolved: group.total - scores.length,
    provisional: scores.length < provisionalBelow,
    brier: mean(scores.map((s) => s.brier)),
    skill: brierSkill(scores),
    absoluteReturnError: mean(scores.map((s) => s.absoluteReturnError)),
    pinball: {
      q10: mean(scores.map((s) => s.pinball.q10)),
      q50: mean(scores.map((s) => s.pinball.q50)),
      q90: mean(scores.map((s) => s.pinball.q90)),
    },
    coverage: mean(scores.map((s) => Number(s.covered))),
    calibration: Array.from({ length: 11 }, (_, tick) => {
      const level = tick / 10;
      const hits = observations.flatMap((o) =>
        (['up', 'flat', 'down'] as const)
          .filter((key) => o.probabilities[key] === level)
          .map((key) => Number(o.outcome === key)),
      );
      return { level, n: hits.length, observed: mean(hits) };
    }),
  }));
}
