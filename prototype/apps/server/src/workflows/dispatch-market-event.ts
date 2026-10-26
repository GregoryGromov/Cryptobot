import { MINUTE, utcDay } from '../kernel/time.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import { EXECUTION_RULES } from '../modules/trading/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';
import { freezeBaseline } from './freeze-baseline.js';

export async function dispatchMarketEvent(deps: Deps, eventId: string) {
  const event = await market.findEvent(deps.db, eventId);
  if (!event) throw new Error('Event missing');
  const snapshot = await market.findSnapshot(deps.db, event.snapshotId);
  if (!snapshot) throw new Error('Snapshot missing');
  // Where brokers answer only when asked, a signal stays where signals are shown and no conversation hears of it.
  if (deps.config.AUTO_ANALYSIS === 'off') return [];
  const results = [];
  for (const personal of await broker.listBrokers(deps.db)) {
    results.push(
      await inTransaction(deps.db, async (tx) => {
        await lock(tx, 'broker', personal.id);
        const prior = await forecast.findEventDispatch(tx, personal.id, event.id);
        if (prior) return { kind: 'dispatched', dispatch: prior } as const;
        const head = await broker.loadHead(tx, personal.id);
        const now = deps.clock.now();
        const used = (await forecast.listDispatches(tx, personal.id)).filter(
          (d) => d.origin === 'event' && utcDay(d.createdAt) === utcDay(now),
        ).length;
        const reason = !head.preferences.markets.includes(event.instrument)
          ? 'not-watched'
          : !head.preferences.autoAnalysis
            ? 'auto-off'
            : snapshot.quality !== 'valid' || snapshot.cutoffAt > event.barEnd
              ? 'data-quality'
              : used >= head.preferences.analysisLimit
                ? 'analysis-limit'
                : null;
        if (reason === 'not-watched') return { kind: 'skipped', reason } as const;
        const chat = await conversation.ensureConversation(
          tx,
          personal.userId,
          personal.id,
          event.instrument,
        );
        if (reason) {
          await conversation.appendEntry(tx, {
            id: newId(),
            conversationId: chat.id,
            kind: 'dispatch-skipped',
            sourceId: event.id,
            body: { eventId: event.id, reason },
            createdAt: now,
          });
          return { kind: 'skipped', reason } as const;
        }
        const dispatch: forecast.Dispatch = {
          id: newId(),
          brokerId: personal.id,
          versionId: head.versionId,
          snapshotId: snapshot.id,
          eventId: event.id,
          requestId: null,
          conversationId: chat.id,
          instrument: event.instrument,
          origin: 'event',
          environment: deps.config.MARKET_MODE,
          t0: event.barEnd + MINUTE,
          deadline: event.barEnd + MINUTE - 1000,
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
          kind: 'market-event',
          sourceId: event.id,
          body: { eventId: event.id, dispatchId: dispatch.id, snapshotId: snapshot.id },
          createdAt: now,
        });
        await enqueue(deps.jobs, tx, 'forecast.run', dispatch.id);
        await enqueue(deps.jobs, tx, 'broker.advance', personal.id, dispatch.t0);
        return { kind: 'dispatched', dispatch } as const;
      }),
    );
  }
  return results;
}
