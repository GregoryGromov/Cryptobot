import { type Horizon, idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { MINUTE } from '../kernel/time.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import type { Deps } from './deps.js';

export const rescoreInputSchema = z.strictObject({
  forecastId: idSchema,
  rules: forecast.scoringRulesSchema,
  prices: z.enum(['original', 'latest']).default('original'),
});
type HorizonResult = {
  horizon: Horizon;
  status: 'recorded' | 'unchanged' | 'waiting' | 'missing-prices' | 'missing-original' | 'missing-baseline';
  dataRevision?: string;
  score?: forecast.Score;
};

/** Explicit retrospective evaluation. No journal, trade, model or notification writes. */
export async function rescoreForecast(deps: Pick<Deps, 'db' | 'clock'>, input: unknown) {
  const { forecastId, rules, prices } = rescoreInputSchema.parse(input);
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'forecast-resolution', forecastId);
    const accepted = await forecast.findForecast(tx, forecastId);
    if (!accepted) throw new Error('Forecast missing');
    const dispatch = await forecast.findDispatch(tx, accepted.dispatchId);
    if (!dispatch) throw new Error('Dispatch missing');
    if (rules.version === dispatch.scoringVersion)
      throw new Error('Rescoring requires a separate rules version');
    const report = {
      forecastId,
      brokerId: dispatch.brokerId,
      brokerVersionId: dispatch.versionId,
      instrument: dispatch.instrument,
      cohort: accepted.cohort,
      environment: dispatch.environment,
      originalRulesVersion: dispatch.scoringVersion,
      rulesVersion: rules.version,
      prices,
    };
    if (accepted.receivedAt >= dispatch.t0)
      return { ...report, kind: 'not-prospective', horizons: [] } as const;
    const now = deps.clock.now();
    await forecast.registerScoringRules(tx, rules, now);
    const originals = (await forecast.listResolutions(tx, forecastId))
      .filter((r) => r.rulesVersion === dispatch.scoringVersion)
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
    const frozen = await forecast.listBaselines(tx, dispatch.id);
    const horizons: HorizonResult[] = [];
    for (const prediction of accepted.body.horizons) {
      const horizon = prediction.horizon;
      const due = dispatch.t0 + horizon * MINUTE;
      if (due > now) {
        horizons.push({ horizon, status: 'waiting' });
        continue;
      }
      const original = originals.find((r) => r.horizon === horizon);
      if (prices === 'original' && !original) {
        horizons.push({ horizon, status: 'missing-original' });
        continue;
      }
      const anchor =
        prices === 'original' && original
          ? await market.findCandleById(tx, original.referenceCandle)
          : (
              await market.loadCandlesAsOf(tx, dispatch.instrument, dispatch.t0 - MINUTE, dispatch.t0, now)
            )[0];
      const outcome =
        prices === 'original' && original
          ? await market.findCandleById(tx, original.outcomeCandle)
          : (await market.loadCandlesAsOf(tx, dispatch.instrument, due - MINUTE, due, now))[0];
      if (!anchor || !outcome) {
        horizons.push({ horizon, status: 'missing-prices' });
        continue;
      }
      const source = frozen.find((b) => b.horizon === horizon)?.body;
      if (!source || source.version !== forecast.BASELINE_RULES.version) {
        horizons.push({ horizon, status: 'missing-baseline' });
        continue;
      }
      const rows = await market.findCandlesByIds(tx, source.candleIds);
      if (rows.length !== source.candleIds.length) throw new Error('Frozen baseline prices missing');
      const baseline = forecast.buildBaseline(rows, horizon, source.cutoff, rules);
      if (baseline.n !== source.n || payloadHash(baseline.candleIds) !== payloadHash(source.candleIds))
        throw new Error('Frozen baseline cannot be reproduced');
      await forecast.recordEvaluationBaseline(tx, {
        dispatchId: dispatch.id,
        horizon,
        rulesVersion: rules.version,
        body: baseline,
        createdAt: now,
      });
      const score = forecast.scoreForecast(
        prediction,
        anchor.candle.close,
        outcome.candle.close,
        baseline.probabilities,
        rules,
      );
      const dataRevision = payloadHash([anchor.id, outcome.id]);
      const inserted = await forecast.recordResolution(tx, {
        id: newId(),
        forecastId,
        horizon,
        rulesVersion: rules.version,
        dataRevision,
        referenceCandle: anchor.id,
        outcomeCandle: outcome.id,
        score,
        createdAt: now,
      });
      horizons.push({ horizon, status: inserted.length ? 'recorded' : 'unchanged', dataRevision, score });
    }
    return { ...report, kind: 'evaluated', horizons } as const;
  });
}
