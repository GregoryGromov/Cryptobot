import * as forecast from '../../modules/forecast/index.js';
import { inReadSnapshot } from '../../platform/db.js';
import type { Deps } from '../../workflows/deps.js';

/** Separate retrospective results; never silently replace the published scoring policy. */
export function evaluationsView(deps: Pick<Deps, 'db'>, value: forecast.Forecast) {
  return inReadSnapshot(deps.db, async (tx) => {
    const dispatch = await forecast.findDispatch(tx, value.dispatchId);
    if (!dispatch) throw new Error('Dispatch missing');
    const resolutions = (await forecast.listResolutions(tx, value.id)).sort(
      (a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id),
    );
    const baselines = await forecast.listEvaluationBaselines(tx, dispatch.id);
    const policies = [];
    for (const version of new Set(resolutions.map((r) => r.rulesVersion))) {
      const original = version === dispatch.scoringVersion;
      const rules = (await forecast.findScoringRules(tx, version))?.body;
      if (!rules) throw new Error('Evaluation rules missing');
      policies.push({
        rules,
        original,
        baselines: original
          ? await forecast.listBaselines(tx, dispatch.id)
          : baselines.filter((b) => b.rulesVersion === version),
        resolutions: resolutions.filter((r) => r.rulesVersion === version),
      });
    }
    return { forecastId: value.id, policies };
  });
}
