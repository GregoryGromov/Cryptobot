import { validateForecast } from '@reinforce/harness-contract';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, payloadHash } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

export async function acceptForecast(deps: Deps, dispatchId: string, raw: unknown) {
  return inTransaction(deps.db, async (tx) => {
    const dispatch = await forecast.findDispatch(tx, dispatchId);
    if (!dispatch) return { kind: 'rejected', errors: ['Unknown dispatch'] } as const;
    await lock(tx, 'broker', dispatch.brokerId);
    await lock(tx, 'dispatch', dispatch.id);
    const snapshot = await market.findSnapshot(tx, dispatch.snapshotId);
    if (!snapshot) throw new Error('Snapshot missing');
    const result = validateForecast(raw, {
      dispatchId: dispatch.id,
      brokerVersionId: dispatch.versionId,
      snapshotId: dispatch.snapshotId,
      inputHash: dispatch.inputHash,
      market: snapshot.body,
    });
    const now = deps.clock.now();
    if (result.kind === 'rejected') {
      await forecast.recordAttempt(tx, { id: newId(), dispatchId, receivedAt: now, errors: result.errors });
      return result;
    }
    const bodyHash = payloadHash(result.value);
    const prior = await forecast.findSubmission(tx, dispatchId);
    if (prior)
      return prior.bodyHash === bodyHash
        ? ({ kind: 'accepted', forecast: prior, replayed: true } as const)
        : ({ kind: 'rejected', errors: ['A different forecast has already been accepted'] } as const);
    const cohort =
      now >= dispatch.deadline
        ? 'late'
        : dispatch.origin === 'on-demand'
          ? 'on-demand'
          : dispatch.deadline - dispatch.createdAt < 30000
            ? 'non-official-timing'
            : 'official';
    const accepted: forecast.Forecast = {
      id: newId(),
      dispatchId,
      brokerId: dispatch.brokerId,
      versionId: dispatch.versionId,
      body: result.value,
      bodyHash,
      receivedAt: now,
      cohort,
    };
    await forecast.recordSubmission(tx, accepted);
    const entry = await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: dispatch.conversationId,
      kind: 'forecast',
      sourceId: accepted.id,
      body: {
        forecastId: accepted.id,
        versionId: dispatch.versionId,
        cohort,
        text: result.value.rationale.thesis,
      },
      createdAt: now,
    });
    await forecast.dropProgress(tx, dispatchId);
    await enqueue(deps.jobs, tx, 'conversation.respond', entry.id);
    await enqueue(deps.jobs, tx, 'forecast.resolve', accepted.id, dispatch.t0 + 5 * 60000);
    return { kind: 'accepted', forecast: accepted, replayed: false } as const;
  });
}
