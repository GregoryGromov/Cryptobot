import { utcDay } from '../kernel/time.js';
import * as account from '../modules/account/index.js';
import * as conversation from '../modules/conversation/index.js';
import { isGeneral } from '../modules/conversation/index.js';
import * as analytics from '../platform/analytics/store.js';
import {
  type AnalyticsPort,
  type AnalyticsProperties,
  analyticsPropertiesSchema,
  type EventName,
} from '../platform/analytics/types.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

/** A deliberately closed projection of the journal, not an automatic event/property collector. */
export function journalAnalytics(
  entry: conversation.Entry,
  topic: string,
): { name: EventName; properties: AnalyticsProperties } | null {
  let name: EventName;
  let human = false;
  switch (entry.kind) {
    case 'welcome':
      name = 'broker_created';
      human = true;
      break;
    case 'user-message':
      name = 'conversation_message';
      human = true;
      break;
    case 'broker-version':
    case 'broker-activation':
    case 'preferences':
      name = 'broker_configured';
      human = true;
      break;
    case 'analysis-request':
      name = 'analysis_requested';
      human = true;
      break;
    case 'forecast':
      name = 'forecast_created';
      break;
    case 'proposal':
      name = 'proposal_created';
      break;
    case 'proposal-decision':
      if (entry.body.decision !== 'confirmed' && entry.body.decision !== 'declined') return null;
      name = entry.body.decision === 'confirmed' ? 'proposal_confirmed' : 'proposal_declined';
      human = true;
      break;
    case 'manual-trade':
      name = 'manual_trade_submitted';
      human = true;
      break;
    case 'trade-closed':
      name = 'trade_result';
      break;
    case 'forecast-resolved':
      name = 'forecast_resolved';
      break;
    default:
      return null;
  }
  const properties: AnalyticsProperties = {
    actor: human ? 'human' : 'background',
    surface: 'journal',
    topic: isGeneral(topic) ? 'general' : 'market',
  };
  const cohort = analyticsPropertiesSchema.shape.cohort.safeParse(entry.body.cohort);
  if (entry.kind === 'forecast' && cohort.success && cohort.data) properties.cohort = cohort.data;
  if (entry.kind === 'trade-closed' && (entry.body.account === 'user' || entry.body.account === 'broker'))
    properties.account = entry.body.account;
  const horizon = analyticsPropertiesSchema.shape.horizon.safeParse(entry.body.horizon);
  if (entry.kind === 'forecast-resolved' && horizon.success && horizon.data)
    properties.horizon = horizon.data;
  return { name, properties };
}

async function humanActivity(
  tx: Tx,
  deps: Deps,
  user: account.User,
  now: number,
  surface: 'web' | 'journal',
) {
  const day = utcDay(now);
  const data = { userId: user.id, occurredAt: now, properties: { actor: 'human' as const, surface } };
  await analytics.recordEvent(tx, deps.jobs, `active:${user.id}:${day}`, { ...data, name: 'human_active' });
  // Return means activity on a later UTC day than account creation, once per user/day.
  if (day > utcDay(user.createdAt))
    await analytics.recordEvent(tx, deps.jobs, `return:${user.id}:${day}`, {
      ...data,
      name: 'user_returned',
    });
}

export async function recordWebVisit(deps: Deps, user: account.User) {
  if (deps.config.POSTHOG_KEY)
    await inTransaction(deps.db, (tx) => humanActivity(tx, deps, user, deps.clock.now(), 'web'));
}

export async function recoverAnalytics(deps: Deps) {
  for (const candidate of await analytics.stalledDeliveries(deps.db, deps.clock.now())) {
    await inTransaction(deps.db, async (tx) => {
      await lock(tx, 'analytics-delivery', candidate.eventId);
      const current = await analytics.findDelivery(tx, candidate.eventId);
      const now = deps.clock.now();
      if (
        !current ||
        current.updatedAt > now - 300000 ||
        current.status === 'sent' ||
        current.status === 'failed' ||
        (current.leaseUntil !== null && current.leaseUntil > now)
      )
        return;
      await analytics.saveDelivery(tx, {
        ...current,
        status: 'pending',
        leaseId: null,
        leaseUntil: null,
        updatedAt: now,
      });
      await enqueue(deps.jobs, tx, 'analytics.send', current.eventId);
    });
  }
}

export async function queueJournalAnalytics(deps: Deps) {
  for (const chat of await conversation.listJournalHeads(deps.db)) {
    if (deps.shutdown?.aborted) break;
    await inTransaction(deps.db, async (tx) => {
      await lock(tx, 'analytics-journal', chat.id);
      const after = await analytics.loadCursor(tx, chat.id);
      const entries = await conversation.readEntries(tx, chat.id, after, 200);
      if (!entries.length) return;
      const user = await account.findUser(tx, chat.userId);
      if (!user) throw new Error('Analytics journal owner missing');
      for (const entry of entries) {
        const event = journalAnalytics(entry, chat.topic);
        if (!event) continue;
        await analytics.recordEvent(tx, deps.jobs, `journal:${entry.id}`, {
          ...event,
          userId: user.id,
          occurredAt: entry.createdAt,
        });
        if (event.properties.actor === 'human')
          await humanActivity(tx, deps, user, entry.createdAt, 'journal');
      }
      await analytics.saveCursor(tx, chat.id, entries.at(-1)!.seq);
    });
  }
}

export async function sendAnalytics(deps: Deps, port: AnalyticsPort, id: string) {
  const claimed = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'analytics-delivery', id);
    const delivery = await analytics.findDelivery(tx, id);
    const event = await analytics.findEvent(tx, id);
    if (!delivery || !event) throw new Error('Analytics event missing');
    if (delivery.status === 'sent' || delivery.status === 'failed') return null;
    const now = deps.clock.now();
    if (delivery.leaseUntil !== null && delivery.leaseUntil > now) throw new Error('Analytics delivery busy');
    if (delivery.attempts >= 8) {
      await analytics.saveDelivery(tx, {
        ...delivery,
        status: 'failed',
        reason: 'retry-limit',
        leaseId: null,
        leaseUntil: null,
        updatedAt: now,
      });
      return null;
    }
    const next: analytics.Delivery = {
      ...delivery,
      status: 'sending',
      attempts: delivery.attempts + 1,
      leaseId: newId(),
      leaseUntil: now + 15000,
      updatedAt: now,
    };
    await analytics.saveDelivery(tx, next);
    // Construct the public shape explicitly; source keys are internal to our outbox.
    return {
      delivery: next,
      event: {
        id: event.id,
        userId: event.userId,
        name: event.name,
        properties: event.properties,
        occurredAt: event.occurredAt,
      },
    };
  });
  if (!claimed) return;
  const result = await port(claimed.event, deps.config.MARKET_MODE, deps.shutdown);
  const retry = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'analytics-delivery', id);
    const delivery = await analytics.findDelivery(tx, id);
    if (delivery?.leaseId !== claimed.delivery.leaseId) return false;
    const exhausted = delivery.attempts >= 8;
    await analytics.saveDelivery(tx, {
      ...delivery,
      leaseId: null,
      leaseUntil: null,
      updatedAt: deps.clock.now(),
      status: result.kind === 'sent' ? 'sent' : result.kind === 'failed' || exhausted ? 'failed' : 'pending',
      reason: result.kind === 'sent' ? null : result.reason,
    });
    return result.kind === 'retry' && !exhausted;
  });
  if (retry) throw new Error('Analytics delivery retry');
}
