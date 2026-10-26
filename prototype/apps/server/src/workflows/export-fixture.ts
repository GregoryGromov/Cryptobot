import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { inReadSnapshot } from '../platform/db.js';
import type { Deps } from './deps.js';

/** Export only market inputs/labels: no user prompts, conversations, credentials or candidate answers. */
export async function exportFixture(deps: Pick<Deps, 'db' | 'clock'>, forecastIds: string[]) {
  return inReadSnapshot(deps.db, async (tx) => {
    const cases: forecast.MarketFixture['cases'] = [];
    for (const id of forecastIds) {
      const value = await forecast.findForecast(tx, id);
      if (!value) throw new Error('Forecast missing');
      const dispatch = await forecast.findDispatch(tx, value.dispatchId);
      if (!dispatch) throw new Error('Dispatch missing');
      const snapshot = await market.findSnapshot(tx, dispatch.snapshotId);
      const rules = await forecast.findScoringRules(tx, dispatch.scoringVersion);
      if (!snapshot || !rules) throw new Error('Fixture provenance missing');
      const baselines = await forecast.listBaselines(tx, dispatch.id);
      const candleIds = [...new Set(baselines.flatMap((b) => b.body.candleIds))];
      const resolutions = (await forecast.listResolutions(tx, id))
        .filter((r) => r.rulesVersion === dispatch.scoringVersion)
        .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
      const outcomes = [];
      for (const prediction of value.body.horizons) {
        const r = resolutions.find((r) => r.horizon === prediction.horizon);
        outcomes.push({
          horizon: prediction.horizon,
          reference: r ? ((await market.findCandleById(tx, r.referenceCandle)) ?? null) : null,
          outcome: r ? ((await market.findCandleById(tx, r.outcomeCandle)) ?? null) : null,
        });
      }
      cases.push({
        id: dispatch.id,
        source: dispatch.environment,
        origin: dispatch.origin,
        cohort: value.cohort,
        instrument: dispatch.instrument,
        t0: dispatch.t0,
        snapshot: {
          id: snapshot.id,
          raw: snapshot.raw,
          inputHash: snapshot.inputHash,
          cutoffAt: snapshot.cutoffAt,
        },
        rules: rules.body,
        history: await market.findCandlesByIds(tx, candleIds),
        baselines: baselines.map((b) => ({
          horizon: b.body.horizon,
          cutoff: b.body.cutoff,
          version: b.body.version as 'baseline-1-provisional',
          n: b.body.n,
          candleIds: b.body.candleIds,
        })),
        outcomes,
      });
    }
    return forecast.fixtureSchema.parse({
      schemaVersion: 'recorded-market-1',
      recordedAt: deps.clock.now(),
      cases,
    });
  });
}
