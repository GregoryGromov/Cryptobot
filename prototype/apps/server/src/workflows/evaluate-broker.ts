import { idSchema, validateForecast } from '@reinforce/harness-contract';
import { z } from 'zod';
import type { ModelPort } from '../adapters/model.js';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as forecast from '../modules/forecast/index.js';
import { availableModels } from '../platform/config.js';
import { inTransaction } from '../platform/db.js';
import { payloadHash } from '../platform/identity.js';
import { callModel } from './call-model.js';
import type { Deps } from './deps.js';

const inputSchema = z.strictObject({
  experimentId: idSchema,
  brokerId: idSchema,
  candidate: forecast.candidateSchema,
  fixture: forecast.fixtureSchema,
  modelMode: z.enum(['synthetic', 'platform']),
});
export async function evaluateBroker(
  deps: Pick<Deps, 'db' | 'clock' | 'config'>,
  port: ModelPort,
  raw: unknown,
) {
  const input = inputSchema.parse(raw);
  const personal = await broker.findBrokerById(deps.db, input.brokerId);
  const owner = personal ? await account.findUser(deps.db, personal.userId) : null;
  if (!personal || !owner) throw new Error('Experiment broker missing');
  if (!availableModels(deps.config).includes(input.candidate.model)) throw new Error('Model unavailable');
  if (input.modelMode === 'platform' && deps.config.MODEL_MODE !== 'live')
    throw new Error('Live model configuration required');
  const definition: forecast.ExperimentDefinition = {
    brokerId: personal.id,
    candidate: input.candidate,
    language: owner.locale,
    fixture: input.fixture,
    harnessVersion: broker.FORECAST_HARNESS_VERSION,
    maxTokens: deps.config.MODEL_MAX_TOKENS,
    modelMode: input.modelMode,
  };
  const definitionHash = payloadHash(definition);
  await inTransaction(deps.db, async (tx) => {
    for (const value of input.fixture.cases)
      await forecast.registerScoringRules(tx, value.rules, deps.clock.now());
    await forecast.recordExperiment(tx, {
      id: input.experimentId,
      brokerId: personal.id,
      body: definition,
      bodyHash: definitionHash,
      createdAt: deps.clock.now(),
    });
  });
  const prior = await forecast.listExperimentResults(deps.db, input.experimentId);
  const statuses: { caseId: string; status: string }[] = [];
  for (const value of input.fixture.cases) {
    if (prior.some((r) => r.caseId === value.id)) {
      statuses.push({ caseId: value.id, status: 'cached' });
      continue;
    }
    const identity = {
      dispatchId: value.id,
      brokerVersionId: input.experimentId,
      snapshotId: value.snapshot.id,
      inputHash: value.snapshot.inputHash,
      market: JSON.parse(value.snapshot.raw) as Record<string, unknown>,
    };
    const validate = (content: string) => {
      try {
        return validateForecast(JSON.parse(content), identity).kind === 'accepted';
      } catch {
        return false;
      }
    };
    const result = await callModel(
      deps,
      port,
      {
        brokerId: personal.id,
        experimentId: input.experimentId,
        userId: owner.id,
        guest: owner.guest,
        kind: 'offline-forecast',
        sourceId: `${input.experimentId}:${value.id}`,
        automatic: false,
        request: broker.forecastRequest({
          ...identity,
          ...input.candidate,
          language: definition.language,
          maxTokens: definition.maxTokens,
        }),
      },
      validate,
    );
    if (result.kind !== 'completed') {
      statuses.push({ caseId: value.id, status: result.kind === 'failed' ? result.reason : result.kind });
      continue;
    }
    const accepted = validateForecast(JSON.parse(result.output.content), identity);
    if (accepted.kind !== 'accepted') throw new Error('Cached model output failed validation');
    await inTransaction(deps.db, (tx) =>
      forecast.recordExperimentResult(tx, {
        experimentId: input.experimentId,
        caseId: value.id,
        runId: result.runId,
        createdAt: deps.clock.now(),
        body: {
          forecast: accepted.value,
          horizons: forecast.evaluateCase(value, accepted.value),
          actualModel: result.output.model,
          inputTokens: result.output.inputTokens,
          outputTokens: result.output.outputTokens,
          cost: result.output.cost,
        },
      }),
    );
    statuses.push({ caseId: value.id, status: 'evaluated' });
  }
  const results = await forecast.listExperimentResults(deps.db, input.experimentId);
  return {
    experimentId: input.experimentId,
    kind: 'offline-experiment' as const,
    definitionHash,
    fixtureHash: payloadHash(input.fixture),
    candidateHash: payloadHash(input.candidate),
    harnessVersion: definition.harnessVersion,
    modelMode: definition.modelMode,
    prospective: false,
    total: input.fixture.cases.length,
    completed: results.length,
    statuses,
    groups: forecast.summarizeExperiment(input.fixture, results),
    results,
  };
}
