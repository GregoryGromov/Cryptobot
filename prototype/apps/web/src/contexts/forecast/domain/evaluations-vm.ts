import type { Horizon } from '@reinforce/server/dto';
import type { AppRouter } from '@reinforce/server/router';
import type { inferRouterOutputs } from '@trpc/server';

export type Evaluations = inferRouterOutputs<AppRouter>['evaluations'];

export type EvaluationSkill = 'better' | 'worse' | 'same' | 'early';

export type EvaluationRow = {
  readonly key: string;
  readonly horizon: Horizon;
  readonly outcome: 'up' | 'flat' | 'down';
  readonly returnPct: number;
  readonly brier: number;
  readonly reference: number | null;
  readonly observations: number;
  readonly skill: EvaluationSkill;
  readonly computedAt: number;
};

export type EvaluationPolicy = {
  readonly version: string;
  readonly original: boolean;
  readonly rows: readonly EvaluationRow[];
};

const SKILL_MARGIN = 0.02;

export const evaluationSkill = (
  brier: number,
  reference: number | null,
  observations: number,
  provisionalBelow: number,
): EvaluationSkill => {
  if (reference === null || reference <= 0 || observations < provisionalBelow) return 'early';
  const skill = 1 - brier / reference;
  if (skill > SKILL_MARGIN) return 'better';
  if (skill < -SKILL_MARGIN) return 'worse';
  return 'same';
};

export const evaluationPolicies = (evaluations: Evaluations): readonly EvaluationPolicy[] =>
  evaluations.policies
    .map((policy) => ({
      version: policy.rules.version,
      original: policy.original,
      rows: [...policy.resolutions]
        .sort((a, b) => a.score.horizon - b.score.horizon || b.createdAt - a.createdAt)
        .map((resolution) => {
          const observations =
            policy.baselines.find((b) => b.horizon === resolution.score.horizon)?.body.n ?? 0;
          return {
            key: resolution.id,
            horizon: resolution.score.horizon,
            outcome: resolution.score.outcome,
            returnPct: resolution.score.returnPct,
            brier: resolution.score.brier,
            reference: resolution.score.referenceBrier,
            observations,
            skill: evaluationSkill(
              resolution.score.brier,
              resolution.score.referenceBrier,
              observations,
              policy.rules.provisionalBelow,
            ),
            computedAt: resolution.createdAt,
          };
        }),
    }))
    .sort((a, b) => Number(b.original) - Number(a.original));
