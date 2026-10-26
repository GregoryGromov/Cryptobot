import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { marketHours } from '../kernel/market-hours.js';
import { MINUTE, nextMinute } from '../kernel/time.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { EXECUTION_RULES } from '../modules/trading/index.js';
import { usesHttpMarket } from '../platform/config.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';
import { freezeBaseline } from './freeze-baseline.js';
import { refreshMarket } from './refresh-market.js';

export const requestForecastSchema = z.strictObject({
  requestId: idSchema,
  instrument: z.string().min(1).max(100),
  text: z.string().max(8000).default(''),
  /** The signal the request asks about; it must be one of this instrument's. */
  eventId: z.string().min(1).max(200).nullable().default(null),
});
export async function requestForecast(deps: Deps, userId: string, raw: unknown) {
  const input = requestForecastSchema.parse(raw);
  if (usesHttpMarket(deps.config)) {
    const personal = await broker.findBroker(deps.db, userId);
    if (!personal) return { kind: 'rejected', reason: 'not-found' } as const;
    // An idempotent replay must not depend on the upstream being available now.
    if (!(await forecast.findRequestDispatch(deps.db, personal.id, input.requestId)))
      await refreshMarket(deps, input.instrument, 8000);
  }
  return inTransaction(deps.db, async (tx) => {
    const personal = await broker.findBroker(tx, userId);
    if (!personal) return { kind: 'rejected', reason: 'not-found' } as const;
    await lock(tx, 'broker', personal.id);
    const prior = await forecast.findRequestDispatch(tx, personal.id, input.requestId);
    if (prior) {
      const entry = await conversation.findSourceEntry(
        tx,
        prior.conversationId,
        'analysis-request',
        input.requestId,
      );
      return prior.instrument === input.instrument &&
        prior.eventId === input.eventId &&
        entry?.body.text === input.text
        ? ({ kind: 'dispatched', dispatch: prior, replayed: true } as const)
        : ({ kind: 'rejected', reason: 'request-conflict' } as const);
    }
    if (input.eventId) {
      if ((await market.findEvent(tx, input.eventId))?.instrument !== input.instrument)
        return { kind: 'rejected', reason: 'not-found' } as const;
      // A broker answers an event once, whether it reached him by itself or was asked about.
      if (await forecast.findEventDispatch(tx, personal.id, input.eventId))
        return { kind: 'rejected', reason: 'already-asked' } as const;
    }
    const now = deps.clock.now();
    const snapshot = await market.currentSnapshot(tx, input.instrument, now, usesHttpMarket(deps.config));
    if (!snapshot)
      return {
        kind: 'rejected',
        reason:
          marketHours(input.instrument, now)?.open === false
            ? 'market-closed'
            : (await market.thinMarket(tx, input.instrument))
              ? 'market-thin'
              : 'market-unavailable',
      } as const;
    const head = await broker.loadHead(tx, personal.id);
    const chat = await conversation.ensureConversation(tx, userId, personal.id, input.instrument);
    const t0 = nextMinute(now + MINUTE);
    const dispatch: forecast.Dispatch = {
      id: newId(),
      brokerId: personal.id,
      versionId: head.versionId,
      snapshotId: snapshot.id,
      eventId: input.eventId,
      requestId: input.requestId,
      conversationId: chat.id,
      instrument: input.instrument,
      origin: 'on-demand',
      environment: deps.config.MARKET_MODE,
      t0,
      deadline: t0 - 1000,
      createdAt: now,
      inputHash: snapshot.inputHash,
      contractVersion: '1',
      scoringVersion: forecast.SCORING_RULES.version,
      executionVersion: EXECUTION_RULES.version,
    };
    await forecast.recordDispatch(tx, dispatch);
    await freezeBaseline(tx, dispatch, snapshot.cutoffAt);
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: chat.id,
      kind: 'analysis-request',
      sourceId: input.requestId,
      body: { text: input.text, dispatchId: dispatch.id, eventId: input.eventId },
      createdAt: now,
    });
    await enqueue(deps.jobs, tx, 'forecast.run', dispatch.id);
    return { kind: 'dispatched', dispatch, replayed: false } as const;
  });
}
