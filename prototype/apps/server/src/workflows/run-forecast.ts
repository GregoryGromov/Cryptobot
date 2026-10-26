import { validateForecast } from '@reinforce/harness-contract';
import type { ModelPort } from '../adapters/model.js';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { inTransaction } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import { acceptForecast } from './accept-forecast.js';
import { callModel } from './call-model.js';
import type { Deps } from './deps.js';

const PROGRESS_MS = 250;

/**
 * Keeps how far the model has written the forecast where the conversation reads it: at most every `PROGRESS_MS`, and
 * only when its step or what is written in full has changed. It starts from reading, over whatever a lost attempt
 * left; the entry the run ends in drops it.
 */
function progressing(deps: Pick<Deps, 'db' | 'clock'>, dispatch: forecast.Dispatch) {
  let latest = forecast.READING;
  let written = '';
  let writes = Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const save = () => {
    timer = null;
    const body = JSON.stringify(latest);
    if (stopped || body === written) return;
    written = body;
    const row = {
      dispatchId: dispatch.id,
      conversationId: dispatch.conversationId,
      body: latest,
      updatedAt: deps.clock.now(),
    };
    // The progress is only a view of the work; the forecast does not depend on it.
    writes = writes.then(() => forecast.writeProgress(deps.db, row)).catch(() => undefined);
  };
  save();
  return {
    update: (_runId: string, partial: unknown) => {
      if (stopped) return;
      latest = forecast.progressOf(partial);
      timer ??= setTimeout(save, PROGRESS_MS);
    },
    stop: async () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      await writes;
    },
  };
}

export async function runForecast(deps: Deps, model: ModelPort, dispatchId: string) {
  const dispatch = await forecast.findDispatch(deps.db, dispatchId);
  if (!dispatch) throw new Error('Dispatch missing');
  const prior = await forecast.findSubmission(deps.db, dispatchId);
  if (prior) return { kind: 'recorded', forecast: prior } as const;
  const personal = await broker.findBrokerById(deps.db, dispatch.brokerId);
  const user = personal ? await account.findUser(deps.db, personal.userId) : undefined;
  const version = await broker.findVersion(deps.db, dispatch.versionId);
  const snapshot = await market.findSnapshot(deps.db, dispatch.snapshotId);
  if (!personal || !user || !version || !snapshot) throw new Error('Forecast input missing');
  const progress = progressing(deps, dispatch);
  const result = await callModel(
    deps,
    model,
    {
      brokerId: personal.id,
      versionId: version.id,
      userId: user.id,
      guest: user.guest,
      kind: 'forecast',
      sourceId: dispatch.id,
      automatic: dispatch.origin === 'event',
      request: broker.forecastRequest({
        model: version.model,
        prompt: version.prompt,
        language: user.locale,
        maxTokens: deps.config.MODEL_MAX_TOKENS,
        dispatchId: dispatch.id,
        brokerVersionId: version.id,
        snapshotId: snapshot.id,
        inputHash: dispatch.inputHash,
        market: snapshot.body,
      }),
    },
    (content) => {
      try {
        return (
          validateForecast(JSON.parse(content), {
            dispatchId,
            brokerVersionId: version.id,
            snapshotId: snapshot.id,
            inputHash: dispatch.inputHash,
            market: snapshot.body,
          }).kind === 'accepted'
        );
      } catch {
        return false;
      }
    },
    progress.update,
  ).finally(progress.stop);
  if (result.kind === 'busy') {
    await inTransaction(deps.db, (tx) => enqueue(deps.jobs, tx, 'forecast.run', dispatch.id, result.retryAt));
    return result;
  }
  if (result.kind === 'superseded') {
    await forecast.dropProgress(deps.db, dispatch.id);
    return result;
  }
  if (result.kind !== 'completed') {
    await inTransaction(deps.db, async (tx) => {
      await forecast.dropProgress(tx, dispatch.id);
      await conversation.appendEntry(tx, {
        id: newId(),
        conversationId: dispatch.conversationId,
        kind: 'run-error',
        sourceId: result.runId,
        body: {
          runId: result.runId,
          sourceId: dispatch.id,
          operation: 'forecast',
          reason: result.kind === 'failed' ? result.reason : result.kind,
        },
        createdAt: deps.clock.now(),
      });
    });
    if (result.kind === 'failed' && ['unavailable', 'rate-limited'].includes(result.reason))
      throw new Error(`Forecast ${result.reason}`);
    return result;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(result.output.content);
  } catch {
    raw = null;
  }
  const accepted = await acceptForecast(deps, dispatch.id, raw);
  if (accepted.kind === 'rejected')
    await inTransaction(deps.db, async (tx) => {
      await forecast.dropProgress(tx, dispatch.id);
      await conversation.appendEntry(tx, {
        id: newId(),
        conversationId: dispatch.conversationId,
        kind: 'run-error',
        sourceId: result.runId,
        body: {
          runId: result.runId,
          sourceId: dispatch.id,
          operation: 'forecast',
          reason: 'invalid-response',
        },
        createdAt: deps.clock.now(),
      });
    });
  return accepted;
}
