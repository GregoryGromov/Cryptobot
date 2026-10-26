import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as runtime from '../modules/runtime/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

export const retryInputSchema = z.strictObject({ runId: idSchema, requestId: idSchema });
export async function retryRun(deps: Deps, userId: string, raw: unknown) {
  const input = retryInputSchema.parse(raw);
  return inTransaction(deps.db, async (tx) => {
    const run = await runtime.findRun(tx, input.runId);
    const personal = await broker.findBroker(tx, userId);
    if (!run || run.brokerId !== personal?.id) return { kind: 'rejected', reason: 'not-found' } as const;
    if (run.kind !== 'forecast' && run.kind !== 'respond')
      return { kind: 'rejected', reason: 'not-found' } as const;
    const dispatch = run.kind === 'forecast' ? await forecast.findDispatch(tx, run.sourceId) : null;
    const source = run.kind === 'respond' ? await conversation.findEntry(tx, run.sourceId) : null;
    const conversationId = dispatch?.conversationId ?? source?.conversationId;
    if (!conversationId) throw new Error('Retry source missing');
    await lock(tx, 'conversation', conversationId);
    const previous = await conversation.findSourceEntry(tx, conversationId, 'run-retry', input.requestId);
    if (previous)
      return previous.body.runId === run.id
        ? ({ kind: 'queued', replayed: true } as const)
        : ({ kind: 'rejected', reason: 'request-conflict' } as const);
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId,
      kind: 'run-retry',
      sourceId: input.requestId,
      body: { runId: run.id },
      createdAt: deps.clock.now(),
    });
    await enqueue(deps.jobs, tx, dispatch ? 'forecast.run' : 'conversation.respond', run.sourceId);
    return { kind: 'queued', replayed: false } as const;
  });
}
