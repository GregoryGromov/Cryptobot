import { MINUTE } from '../kernel/time.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

export async function resolveForecast(deps: Deps, forecastId: string) {
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'forecast-resolution', forecastId);
    const accepted = await forecast.findForecast(tx, forecastId);
    if (!accepted) throw new Error('Forecast missing');
    const dispatch = await forecast.findDispatch(tx, accepted.dispatchId);
    if (!dispatch) throw new Error('Dispatch missing');
    if (accepted.receivedAt >= dispatch.t0) return { kind: 'not-prospective' } as const;
    const rules = forecast.scoringRulesSchema.parse(
      (await forecast.findScoringRules(tx, dispatch.scoringVersion))?.body,
    );
    const now = deps.clock.now();
    const anchor = await market.findCandle(tx, dispatch.instrument, dispatch.t0 - MINUTE);
    const baselines = await forecast.listBaselines(tx, dispatch.id);
    let unresolved = 0;
    let nextAt: number | null = null;
    for (const prediction of accepted.body.horizons) {
      const due = dispatch.t0 + prediction.horizon * MINUTE;
      if (due > now) {
        nextAt = Math.min(nextAt ?? due, due);
        continue;
      }
      const outcome = await market.findCandle(tx, dispatch.instrument, due - MINUTE);
      if (!anchor || !outcome) {
        unresolved++;
        continue;
      }
      const reference = baselines.find((b) => b.horizon === prediction.horizon)?.body.probabilities ?? null;
      const score = forecast.scoreForecast(
        prediction,
        anchor.candle.close,
        outcome.candle.close,
        reference,
        rules,
      );
      const revision = payloadHash([anchor.id, outcome.id]);
      const inserted = await forecast.recordResolution(tx, {
        id: newId(),
        forecastId,
        horizon: prediction.horizon,
        rulesVersion: dispatch.scoringVersion,
        dataRevision: revision,
        referenceCandle: anchor.id,
        outcomeCandle: outcome.id,
        score,
        createdAt: now,
      });
      const record = inserted[0];
      if (record)
        await conversation.appendEntry(tx, {
          id: newId(),
          conversationId: dispatch.conversationId,
          kind: 'forecast-resolved',
          sourceId: record.id,
          body: { forecastId, horizon: prediction.horizon, score },
          createdAt: now,
        });
    }
    if (unresolved > 0 || nextAt !== null)
      await enqueue(
        deps.jobs,
        tx,
        'forecast.resolve',
        forecastId,
        unresolved > 0 ? Math.min(now + 15000, nextAt ?? Infinity) : nextAt!,
      );
    return { kind: unresolved ? 'unresolved' : nextAt ? 'waiting' : 'resolved', unresolved } as const;
  });
}
