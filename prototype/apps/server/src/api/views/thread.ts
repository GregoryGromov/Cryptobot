import type { Locale } from '@reinforce/i18n/server';
import { TRPCError } from '@trpc/server';
import * as broker from '../../modules/broker/index.js';
import * as conversation from '../../modules/conversation/index.js';
import * as forecast from '../../modules/forecast/index.js';
import * as market from '../../modules/market/index.js';
import type { Deps } from '../../workflows/deps.js';
import type { ThreadView } from '../view-types.js';
import { proposalCards } from './conversations.js';
import { forecastView } from './forecasts.js';
import { marketName, quote, signalView } from './market.js';
import { portfolioView } from './portfolio.js';

export async function ownedDispatch(deps: Deps, userId: string, id: string) {
  const personal = await broker.findBroker(deps.db, userId);
  const prediction = await forecast.findForecast(deps.db, id);
  const dispatch = await forecast.findDispatch(deps.db, prediction?.dispatchId ?? id);
  if (!personal || dispatch?.brokerId !== personal.id) throw new TRPCError({ code: 'NOT_FOUND' });
  return dispatch;
}
export async function threadView(
  deps: Deps,
  userId: string,
  id: string,
  locale: Locale,
): Promise<ThreadView> {
  const dispatch = await ownedDispatch(deps, userId, id);
  const value = await forecast.findSubmission(deps.db, dispatch.id);
  const prediction = value ? await forecastView(deps, value) : null;
  const event = dispatch.eventId ? await market.findEvent(deps.db, dispatch.eventId) : null;
  const signal = event ? signalView(event) : null;
  const portfolio = await portfolioView(deps, userId, locale);
  const proposals = [...(await proposalCards(deps, dispatch.brokerId, portfolio.user.rows, locale)).values()]
    .filter((p) => p.forecastId === value?.id)
    .sort((a, b) => a.version - b.version);
  const entries = await conversation.readEntries(deps.db, dispatch.conversationId, 0, 10000);
  const q = await quote(deps, dispatch.instrument, locale);
  return {
    id: dispatch.id,
    chat: dispatch.instrument,
    ...marketName(dispatch.instrument, locale),
    origin: dispatch.origin === 'event' ? 'event' : 'request',
    createdAt: dispatch.createdAt,
    anchor: event?.barEnd ?? dispatch.t0,
    price: q.price,
    costPct: 0.29,
    latestBarEnd: q.lastBarEnd,
    event:
      event && signal
        ? {
            id: event.id,
            ...marketName(event.instrument, locale),
            at: event.barEnd,
            direction: signal.direction,
            move: signal.move,
            horizon: signal.horizon,
            triggered: [signal.horizon],
            severity: '',
            scope: signal.scope,
            volumeConfirmed: signal.volumeConfirmed,
          }
        : null,
    forecasts: prediction ? [prediction] : [],
    proposals,
    messages: entries
      .filter((e) => ['user-message', 'broker-message'].includes(e.kind))
      .map((e) => ({
        id: e.id,
        role: e.kind === 'user-message' ? 'user' : 'broker',
        text: String(e.body.text),
        at: e.createdAt,
        channel: 'web',
        forecastId: null,
        proposalId: null,
        runId: typeof e.body.runId === 'string' ? e.body.runId : null,
      })),
    runs: [],
    agentTrades: portfolio.agent.rows.filter(
      (r) => r.coin === dispatch.instrument && r.entryAt === dispatch.t0,
    ),
    userTrades: portfolio.user.rows.filter((r) => proposals.some((p) => p.tradeId === r.id)),
  };
}
