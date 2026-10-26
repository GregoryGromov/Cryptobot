import {
  ModelFailure,
  type ModelPort,
  type ModelRequest,
  type ModelResult,
  modelRequestSchema,
  modelResultSchema,
} from '../adapters/model.js';
import { utcDay } from '../kernel/time.js';
import * as runtime from '../modules/runtime/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { logger } from '../platform/log.js';
import type { Deps } from './deps.js';
import { ownModelAccess, ownModelChosen } from './own-model.js';

type Input = {
  brokerId: string;
  userId: string;
  guest: boolean;
  sourceId: string;
  automatic: boolean;
  request: ModelRequest;
} & (
  | { kind: 'forecast' | 'respond'; versionId: string; experimentId?: never }
  | { kind: 'offline-forecast'; experimentId: string; versionId?: never }
);
/** `onPartial` streams the answer: it is told the run and what the model has written of it so far. */
export async function callModel(
  deps: Pick<Deps, 'db' | 'clock' | 'config'> & Partial<Pick<Deps, 'xaiAuth' | 'ownModel'>>,
  port: ModelPort,
  input: Input,
  validateOutput?: (content: string) => boolean,
  onPartial?: (runId: string, partial: unknown) => void,
) {
  const prepared = await inTransaction(deps.db, async (tx) => {
    const run = await runtime.ensureRun(tx, {
      id: newId(),
      brokerId: input.brokerId,
      versionId: input.versionId ?? null,
      experimentId: input.experimentId ?? null,
      kind: input.kind,
      sourceId: input.sourceId,
      input: input.request,
      createdAt: deps.clock.now(),
    });
    await lock(tx, 'run', run.id);
    const current = await runtime.loadRun(tx, run.id);
    if (current.state === 'succeeded' && current.output) return { kind: 'cached', run: current } as const;
    const now = deps.clock.now();
    const day = utcDay(now);
    if (current.state === 'running' && current.leaseUntil !== null && current.leaseUntil > now)
      return { kind: 'busy', runId: run.id, retryAt: current.leaseUntil } as const;
    if (current.state === 'running') await runtime.expireAttempt(tx, current, now);
    const request = modelRequestSchema.parse(current.input);
    // A user's own model spends their allowance at xAI, not the platform's: only what the broker starts by itself
    // stays limited, so that it cannot use the allowance up while the user is away.
    const own = input.kind !== 'offline-forecast' && (await ownModelChosen(deps, tx, input.userId));
    const scopes = [
      ...(own
        ? []
        : [
            { scope: 'global', day, limit: deps.config.DAILY_GLOBAL_CALLS },
            {
              scope: `user:${input.userId}`,
              day,
              limit: input.guest ? deps.config.DAILY_GUEST_CALLS : deps.config.DAILY_USER_CALLS,
            },
          ]),
      ...(input.automatic
        ? [{ scope: `auto:${input.userId}`, day, limit: deps.config.DAILY_AUTO_CALLS }]
        : []),
    ];
    if (!(await runtime.reserveBudget(tx, scopes)))
      return { kind: 'quota-exhausted', runId: run.id } as const;
    const attempt = await runtime.beginAttempt(tx, current, now, now + deps.config.MODEL_TIMEOUT_MS + 10000);
    const call: runtime.Call = {
      id: newId(),
      runId: run.id,
      userId: input.userId,
      attempt,
      model: request.model,
      route: own ? 'own' : 'platform',
      automatic: input.automatic,
      maxTokens: request.maxTokens,
      budgetScopes: scopes.map(({ scope, day }) => ({ scope, day })),
      createdAt: now,
    };
    await runtime.recordCall(tx, call);
    return { kind: 'ready', call, request } as const;
  });
  if (prepared.kind === 'quota-exhausted' || prepared.kind === 'busy') return prepared;
  if (prepared.kind === 'cached')
    return {
      kind: 'completed',
      runId: prepared.run.id,
      attempt: prepared.run.attempt,
      output: modelResultSchema.parse(prepared.run.output),
    } as const;
  let output: ModelResult | { error: ModelFailure['kind'] };
  const started = performance.now();
  try {
    const runId = prepared.call.runId;
    const signal = AbortSignal.timeout(deps.config.MODEL_TIMEOUT_MS);
    output =
      prepared.call.route === 'own' && deps.ownModel
        ? await deps.ownModel(prepared.request, await ownModelAccess(deps, input.userId), signal)
        : await port(
            prepared.request,
            signal,
            onPartial && ((partial) => onPartial(runId, partial)),
            prepared.call.attempt,
          );
    if (validateOutput && !validateOutput(output.content)) output = { ...output, error: 'invalid-response' };
  } catch (error) {
    output = { error: error instanceof ModelFailure ? error.kind : 'unavailable' };
  }
  const recorded = output;
  logger.info(
    {
      runId: prepared.call.runId,
      brokerId: input.brokerId,
      versionId: input.versionId,
      experimentId: input.experimentId,
      attempt: prepared.call.attempt,
      durationMs: Math.round(performance.now() - started),
      outcome: 'error' in output ? output.error : 'completed',
    },
    'model-call',
  );
  const current = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'run', prepared.call.runId);
    await runtime.finishCall(tx, prepared.call, recorded, deps.clock.now());
    return runtime.finishAttempt(
      tx,
      prepared.call.runId,
      prepared.call.attempt,
      recorded,
      deps.clock.now(),
      !('error' in recorded),
    );
  });
  if (!current) return { kind: 'superseded' } as const;
  return 'error' in output
    ? ({ kind: 'failed', reason: output.error, runId: prepared.call.runId } as const)
    : ({ kind: 'completed', runId: prepared.call.runId, attempt: prepared.call.attempt, output } as const);
}
