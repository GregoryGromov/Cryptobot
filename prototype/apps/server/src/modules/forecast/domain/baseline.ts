import type { Candle, Horizon } from '@reinforce/harness-contract';
import { D } from '../../../kernel/money.js';
import { MINUTE } from '../../../kernel/time.js';
import { type Probabilities, SCORING_RULES, type ScoringRules } from './scoring.js';

export const BASELINE_RULES = {
  version: 'baseline-1-provisional',
  windowMinutes: 10080,
  minimumSamples: 30,
} as const;
export type Baseline = {
  version: string;
  horizon: Horizon;
  cutoff: number;
  n: number;
  probabilities: Probabilities | null;
  candleIds: string[];
};

/** Disjoint UTC-aligned intervals ending before the snapshot; no detector-selected samples. */
export function buildBaseline(
  rows: readonly { id: string; candle: Candle }[],
  horizon: Horizon,
  cutoff: number,
  rules: ScoringRules = SCORING_RULES,
): Baseline {
  const byClose = new Map(
    rows.filter((r) => r.candle.openAt + MINUTE <= cutoff).map((r) => [r.candle.openAt + MINUTE, r]),
  );
  const counts = { up: 0, flat: 0, down: 0 };
  const used = new Set<string>();
  const interval = horizon * MINUTE;
  const from = cutoff - BASELINE_RULES.windowMinutes * MINUTE;
  for (const [at, anchor] of byClose) {
    if (at < from || at % interval !== 0) continue;
    const end = byClose.get(at + interval);
    if (!end) continue;
    const ret = new D(end.candle.close).div(anchor.candle.close).minus(1).mul(100);
    const band = rules.neutralPct[horizon];
    counts[ret.gt(band) ? 'up' : ret.lt(-band) ? 'down' : 'flat']++;
    used.add(anchor.id);
    used.add(end.id);
  }
  const n = counts.up + counts.flat + counts.down;
  return {
    version: BASELINE_RULES.version,
    horizon,
    cutoff,
    n,
    candleIds: [...used].sort(),
    probabilities:
      n < BASELINE_RULES.minimumSamples
        ? null
        : { up: counts.up / n, flat: counts.flat / n, down: counts.down / n },
  };
}
