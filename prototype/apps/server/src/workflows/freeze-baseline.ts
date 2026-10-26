import { HORIZONS } from '@reinforce/harness-contract';
import { MINUTE } from '../kernel/time.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import type { Tx } from '../platform/db.js';

export async function freezeBaseline(tx: Tx, dispatch: forecast.Dispatch, cutoff: number) {
  if (dispatch.scoringVersion !== forecast.SCORING_RULES.version)
    throw new Error('Unsupported scoring rules');
  await forecast.registerScoringRules(tx, forecast.SCORING_RULES, dispatch.createdAt);
  const candles = await market.loadCandlesAsOf(
    tx,
    dispatch.instrument,
    cutoff - (forecast.BASELINE_RULES.windowMinutes + 1) * MINUTE,
    cutoff,
    dispatch.createdAt,
  );
  for (const horizon of HORIZONS)
    await forecast.recordBaseline(tx, {
      dispatchId: dispatch.id,
      horizon,
      body: forecast.buildBaseline(candles, horizon, cutoff),
      createdAt: dispatch.createdAt,
    });
}
