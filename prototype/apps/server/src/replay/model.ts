import { ModelFailure, type ModelPort } from '../adapters/model.js';
import { replayModel } from '../adapters/replay-model.js';
import type { ReplayScenario } from './scenario.js';

/** Rebind only receipt identities; recorded prediction numbers and wording stay unchanged. */
export function scenarioModel(source: ReplayScenario['model']) {
  let used = 0;
  const port: ModelPort = async (request, signal) => {
    signal.throwIfAborted();
    if (source.kind === 'synthetic') {
      used++;
      return replayModel(request, signal);
    }
    const next = source.responses[used++];
    const input = JSON.parse(request.messages.at(-1)!.content) as Record<string, unknown>;
    if (!next || next.operation !== input.kind) throw new ModelFailure('invalid-response');
    if (next.response.kind === 'error') throw new ModelFailure(next.response.reason);
    let content = next.response.content;
    if (next.operation === 'forecast') {
      try {
        const value = JSON.parse(content);
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const field of ['dispatchId', 'brokerVersionId', 'snapshotId', 'inputHash'])
            value[field] = input[field];
          content = JSON.stringify(value);
        }
      } catch {
        /* Keep invalid output invalid so the production validator handles it. */
      }
    }
    return { content, model: `recorded:${next.response.model}`, cost: 0, inputTokens: 0, outputTokens: 0 };
  };
  return {
    port,
    usage: () => ({
      kind: source.kind,
      used,
      unused: source.kind === 'recorded' ? Math.max(0, source.responses.length - used) : 0,
    }),
  };
}
