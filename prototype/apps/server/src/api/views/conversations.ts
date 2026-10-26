import { type Horizon, MODE_HORIZON } from '@reinforce/harness-contract';
import { known, type Locale, signedUsd, type Translate, translator } from '@reinforce/i18n/server';
import { TRPCError } from '@trpc/server';
import { MINUTE, nextMinute } from '../../kernel/time.js';
import * as broker from '../../modules/broker/index.js';
import * as conversation from '../../modules/conversation/index.js';
import * as forecast from '../../modules/forecast/index.js';
import * as market from '../../modules/market/index.js';
import * as runtime from '../../modules/runtime/index.js';
import * as trading from '../../modules/trading/index.js';
import { RETRY_LIMIT } from '../../platform/jobs.js';
import type { Deps } from '../../workflows/deps.js';
import { spanSchema } from '../../workflows/send-message.js';
import { tradePreview } from '../trade-preview.js';
import type {
  AnalysisProgress,
  Chat,
  ChatItem,
  ChatMessage,
  ChatProposal,
  Chats,
  Estimate,
  ForecastView,
  Preview,
  Signals,
  SignalView,
  TradeRow,
} from '../view-types.js';
import { forecastNote, forecastView, journalView, qualityView } from './forecasts.js';
import { marketOverview, quote, signalSpark, signalView, sinceSignal } from './market.js';
import { portfolioView } from './portfolio.js';

const message = (
  key: string,
  at: number,
  text: string,
  role: ChatMessage['role'] = 'broker',
): ChatMessage => ({
  kind: 'message',
  key,
  at,
  text,
  requestId: null,
  followUps: [],
  span: null,
  role,
  channel: 'platform',
  threadId: '',
  forecast: null,
  signal: null,
  proposal: null,
  tradeId: null,
  options: null,
  handoff: null,
});
// Without a signal for this long the market reads as quiet, and its biggest moves of the hour stand in.
const QUIET_AFTER = 60 * MINUTE;
const MOVERS = 3;

/** The same market on two exchanges, `xyz:SNDK` and `io:SNDK`, moves as one. */
export const underlying = (coin: string): string => coin.slice(coin.indexOf(':') + 1);

/** The markets that moved most over the hour, each underlying once; only markets read in the last minutes. */
export const moversOf = (
  quotes: readonly Awaited<ReturnType<typeof quote>>[],
  now: number,
): NonNullable<Signals['quiet']>['movers'] => {
  const moving = quotes
    .flatMap((q) =>
      q.change1h !== null &&
      Math.abs(q.change1h) >= 0.01 &&
      q.lastBarEnd !== null &&
      now - q.lastBarEnd <= market.LIVE_STATE_AGE
        ? [{ ...q, change1h: q.change1h }]
        : [],
    )
    .sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h));
  return moving
    .filter(
      (q, index) => moving.findIndex((other) => underlying(other.coin) === underlying(q.coin)) === index,
    )
    .slice(0, MOVERS)
    .map((q) => ({
      coin: q.coin,
      name: q.name,
      ticker: q.ticker,
      cls: q.cls,
      chat: q.coin,
      change1h: q.change1h,
      spark: q.spark,
    }));
};

export async function signalsView(deps: Deps, userId: string | undefined, locale: Locale): Promise<Signals> {
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  const dispatched = personal ? await forecast.listDispatches(deps.db, personal.id) : [];
  const events = await market.listEvents(deps.db, 100);
  const items = (
    await Promise.all(
      events.map(async (event) => {
        const signal = signalView(event);
        if (!signal) return null;
        const [q, spark] = await Promise.all([
          quote(deps, event.instrument, locale),
          signalSpark(deps, event),
        ]);
        const dispatch = dispatched.find((d) => d.eventId === event.id);
        return {
          ...q,
          ...signal,
          spark,
          chat: event.instrument,
          since: sinceSignal(spark, q.price),
          asked: Boolean(dispatch),
          threadId: dispatch?.id ?? null,
        };
      }),
    )
  ).filter((x) => x !== null);
  const overview = await marketOverview(deps, locale);
  const now = deps.clock.now();
  const heard = Math.max(0, ...items.map((item) => item.eventAt));
  return {
    items,
    quiet:
      now - heard <= QUIET_AFTER
        ? null
        : {
            kind: 'quiet',
            loading: overview.state.phase !== 'ready',
            markets: overview.state.total,
            movers: moversOf(overview.quotes, now),
          },
  };
}
function estimate(terms: trading.ProposalVersion['terms'], reference: number, now: number): Estimate {
  const rules = trading.rulesFor('lower');
  return {
    ...tradePreview(terms, reference, rules),
    entryAt: nextMinute(now),
    exitBy: nextMinute(now) + terms.horizon * MINUTE,
  };
}
/** `sources` limits the cards to the versions answering those entries. */
export async function proposalCards(
  deps: Deps,
  brokerId: string,
  rows: TradeRow[],
  locale: Locale,
  sources?: ReadonlySet<string>,
) {
  const proposals = await trading.listProposals(deps.db, brokerId);
  const cards = new Map<string, ChatProposal & { replyTo: string }>();
  const owner = await broker.findBrokerById(deps.db, brokerId);
  const userAccount = owner ? await trading.findAccount(deps.db, owner.userId, 'user') : undefined;
  for (const proposal of proposals) {
    const versions = await trading.listProposalVersions(deps.db, proposal.id);
    if (sources && !versions.some((v) => sources.has(v.sourceId))) continue;
    const decision = await trading.findDecision(deps.db, proposal.id);
    for (const version of versions) {
      if (sources && !sources.has(version.sourceId)) continue;
      const terms = version.terms;
      const q = await quote(deps, terms.instrument, locale);
      const order = userAccount
        ? await trading.findSourceOrder(deps.db, userAccount.id, 'proposal', version.id)
        : undefined;
      const status: ChatProposal['status'] =
        decision?.versionId === version.id
          ? decision.decision === 'confirmed'
            ? 'confirmed'
            : 'skipped'
          : versions[0]?.id !== version.id || decision
            ? 'superseded'
            : deps.clock.now() >= version.validUntil
              ? 'expired'
              : 'open';
      cards.set(version.id, {
        id: version.id,
        version: version.number,
        status,
        side: terms.side,
        sizeUsd: Number(terms.amount),
        stopLossPct: terms.stopPct,
        takeProfitPct: terms.targetPct,
        horizon: terms.horizon,
        rationale: '',
        risk: '',
        refPrice: q.price,
        createdAt: version.createdAt,
        expiresAt: version.validUntil,
        origin: 'broker',
        forecastId: proposal.forecastId,
        tradeId: order?.id ?? null,
        trade: rows.find((r) => r.id === order?.id) ?? null,
        estimate:
          status === 'open' &&
          q.price !== null &&
          q.lastBarEnd !== null &&
          deps.clock.now() - q.lastBarEnd <= market.LIVE_STATE_AGE
            ? estimate(terms, q.price, deps.clock.now())
            : null,
        latest: versions[0]?.id === version.id,
        replyTo: version.sourceId,
      });
    }
  }
  return cards;
}
type Feed = {
  t: Translate;
  locale: Locale;
  /** Every entry an entry of the feed may refer to, by id. */
  entries: ReadonlyMap<string, conversation.Entry>;
  forecasts: ReadonlyMap<string, ForecastView & { threadId: string | null }>;
  cards: ReadonlyMap<string, ChatProposal & { replyTo: string }>;
  signals: ReadonlyMap<string, SignalView>;
  runs: runtime.Run[];
  rows: TradeRow[];
  /** Runs whose failed attempt their job is about to run again. */
  retrying: ReadonlySet<string>;
};
// A signal the broker has read stands over his reading, not as a line of its own: the event and what he made of it
// are one thing in the conversation. Signals are keyed by their dispatch, which is the forecast's thread.
async function signalsOf(deps: Deps, entries: conversation.Entry[], spark: boolean) {
  const signals = new Map<string, SignalView>();
  for (const entry of entries.filter((e) => e.kind === 'market-event' || e.kind === 'analysis-request')) {
    const eventId = entry.kind === 'market-event' ? entry.sourceId : entry.body.eventId;
    if (typeof eventId !== 'string') continue;
    const event = await market.findEvent(deps.db, eventId);
    const signal = event ? signalView(event) : null;
    if (signal && event)
      signals.set(String(entry.body.dispatchId), {
        ...signal,
        spark: spark ? await signalSpark(deps, event) : null,
      });
  }
  return signals;
}
/** The items a run of entries shows in the conversation; the last of them is what the conversation shows last. */
function feedItems(entries: conversation.Entry[], feed: Feed): ChatItem[] {
  const { t, locale } = feed;
  const read = new Set(
    entries
      .filter((e) => e.kind === 'forecast')
      .flatMap((e) => feed.forecasts.get(String(e.body.forecastId))?.threadId ?? []),
  );
  // Signals left unread for one reason one after another are one line: how many came, and why.
  const skips = new Map<ChatItem, { reason: string; count: number }>();
  const items: ChatItem[] = [];
  for (const entry of entries) {
    const body = entry.body;
    if (['welcome', 'user-message', 'broker-message'].includes(entry.kind)) {
      // The welcome is the platform's line, not the broker's words: it is said in the language of the page.
      const item = message(
        entry.id,
        entry.createdAt,
        entry.kind === 'welcome' ? t('chat.welcome') : typeof body.text === 'string' ? body.text : '',
        entry.kind === 'user-message' ? 'user' : 'broker',
      );
      if (entry.kind === 'user-message') {
        item.requestId = entry.sourceId;
        const span = spanSchema.safeParse(body.span);
        if (span.success) item.span = span.data;
      }
      const source = typeof body.replyTo === 'string' ? feed.entries.get(body.replyTo) : undefined;
      const f = source?.kind === 'forecast' ? feed.forecasts.get(String(source.body.forecastId)) : undefined;
      if (f) {
        item.forecast = forecastNote(f, f.threadId ?? f.id);
        item.threadId = f.threadId ?? f.id;
      }
      if (entry.kind === 'broker-message') {
        // A reply to a forecast stands where the forecast stood, under its key, so the card is not drawn anew.
        if (f && source) item.key = source.id;
        if (Array.isArray(body.followUps))
          item.followUps = body.followUps.filter((q): q is string => typeof q === 'string');
        item.proposal = [...feed.cards.values()].find((card) => card.replyTo === body.replyTo) ?? null;
        if (f) item.signal = feed.signals.get(f.threadId ?? f.id) ?? null;
        const handoff = Array.isArray(body.handoff)
          ? body.handoff.filter((coin): coin is string => typeof coin === 'string')
          : [];
        if (handoff.length > 0)
          item.handoff = {
            markets: handoff,
            question:
              source?.kind === 'user-message' && typeof source.body.text === 'string'
                ? source.body.text
                : null,
          };
      }
      if (body.proposalOmittedReason === 'idea-limit') item.text += `\n\n${t('chat.ideaLimit')}`;
      items.push(item);
    } else if (entry.kind === 'analysis-request') {
      // A forecast asked for in words: the words stand in the conversation as the user's, before what answers them.
      if (typeof body.text === 'string' && body.text.trim())
        items.push({ ...message(entry.id, entry.createdAt, body.text, 'user'), requestId: entry.sourceId });
    } else if (entry.kind === 'forecast') {
      if (entries.some((e) => e.kind === 'broker-message' && e.body.replyTo === entry.id)) continue;
      const f = feed.forecasts.get(String(body.forecastId));
      if (f)
        items.push({
          ...message(entry.id, entry.createdAt, f.rationale?.thesis ?? ''),
          threadId: f.threadId ?? f.id,
          forecast: forecastNote(f, f.threadId ?? f.id),
          signal: feed.signals.get(f.threadId ?? f.id) ?? null,
        });
    } else if (entry.kind === 'market-event') {
      // Until the forecast comes (or where it failed) the signal stands alone.
      const signal = feed.signals.get(String(body.dispatchId));
      if (signal && !read.has(String(body.dispatchId)))
        items.push({ kind: 'signal', key: entry.id, at: entry.createdAt, ...signal });
    } else if (entry.kind === 'dispatch-skipped') {
      const reason = String(body.reason);
      const text = known(t('chat.skipped', { returnObjects: true }), reason);
      const why = known(t('chat.skippedWhy', { returnObjects: true }), reason);
      if (!text || !why) continue;
      const last = items.at(-1);
      const run = last && skips.get(last);
      if (last?.kind === 'message' && run?.reason === reason) {
        run.count += 1;
        last.text = `${t('chat.received', { count: run.count })} ${why}`;
      } else {
        const item = message(entry.id, entry.createdAt, text, 'system');
        skips.set(item, { reason, count: 1 });
        items.push(item);
      }
    } else if (entry.kind === 'run-error') {
      const run = feed.runs.find((run) => run.id === body.runId);
      if (run?.state === 'succeeded' || run?.state === 'running' || feed.retrying.has(String(body.runId)))
        continue;
      items.push({
        kind: 'failed',
        key: entry.id,
        at: entry.createdAt,
        runId: String(body.runId),
        runKind: body.operation === 'forecast' ? 'forecast' : 'converse',
        error:
          known(t('chat.runError', { returnObjects: true }), String(body.reason)) ?? t('chat.runError.other'),
        retry: true,
      });
    } else if (entry.kind === 'trade-closed' && body.account === 'user') {
      const row = feed.rows.find((r) => r.id === body.orderId);
      if (row?.status === 'closed')
        items.push({
          ...message(
            entry.id,
            entry.createdAt,
            t('chat.tradeClosed', { pnl: signedUsd(row.pnl, locale) }),
            'system',
          ),
          tradeId: row.id,
        });
    } else if (entry.kind === 'broker-version' || entry.kind === 'broker-activation') {
      items.push(
        message(entry.id, entry.createdAt, t('chat.versionOn', { n: String(body.number) }), 'system'),
      );
    }
  }
  return items;
}
// The model failures a job runs again by itself seconds later: until it has, the broker is still at it.
const RETRIED = new Set(['unavailable', 'rate-limited']);
const RETRY_OVERDUE = MINUTE;

/** The runs whose last attempt failed in a way their job retries, with attempts left and the retry not overdue. */
function retryingRuns(entries: conversation.Entry[], runs: runtime.Run[], now: number): ReadonlySet<string> {
  const retrying = new Set<string>();
  for (const entry of entries.filter((e) => e.kind === 'run-error')) {
    const run = runs.find((r) => r.id === entry.body.runId);
    if (
      run?.state === 'failed' &&
      RETRIED.has(String(entry.body.reason)) &&
      run.attempt <= RETRY_LIMIT &&
      now - entry.createdAt < RETRY_OVERDUE
    )
      retrying.add(run.id);
  }
  return retrying;
}

/** What the broker is still doing in a conversation: `errored` holds the runs that have failed in it. */
/** How far the model has written an analysis, as the conversation shows it while it waits. */
export const analysisProgress = (row: forecast.ProgressRow): AnalysisProgress => ({
  id: row.dispatchId,
  stage: row.body.stage,
  odds: row.body.odds.map(({ probabilities: p, ...odds }) => ({
    ...odds,
    probs: { p_up: p.up, p_flat: p.flat, p_down: p.down },
  })),
  plan: row.body.plan,
  headline: row.body.headline,
  thesis: row.body.thesis,
});

function pendingOf(
  entries: conversation.Entry[],
  conversationId: string | undefined,
  work: {
    runs: runtime.Run[];
    dispatches: forecast.Dispatch[];
    answered: ReadonlySet<string>;
    errored: ReadonlySet<string>;
    retrying?: ReadonlySet<string>;
  },
): Chat['pending'] {
  const dispatches = work.dispatches.filter((d) => d.conversationId === conversationId);
  const runs = work.runs.filter((run) =>
    run.kind === 'respond'
      ? entries.some((e) => e.id === run.sourceId)
      : dispatches.some((d) => d.id === run.sourceId),
  );
  const pending: Chat['pending'] = runs
    .filter(
      (run) =>
        run.state === 'running' ||
        (run.state === 'pending' && !work.errored.has(run.id)) ||
        work.retrying?.has(run.id),
    )
    .map((run) => {
      const dispatch = dispatches.find((d) => d.id === run.sourceId);
      // Keyed by what is answered, not by the run, so a wait keeps its key once the job takes it up.
      return {
        id: run.sourceId,
        kind: run.kind === 'forecast' ? 'forecast' : 'converse',
        t0: dispatch?.t0 ?? null,
        deadline: dispatch?.deadline ?? null,
        since: dispatch?.createdAt ?? entries.find((e) => e.id === run.sourceId)?.createdAt ?? run.createdAt,
        attempt: work.retrying?.has(run.id) ? run.attempt + 1 : run.attempt,
      };
    });
  for (const dispatch of dispatches)
    if (
      !work.runs.some((r) => r.kind === 'forecast' && r.sourceId === dispatch.id) &&
      !work.answered.has(dispatch.id)
    )
      pending.push({
        id: dispatch.id,
        kind: 'forecast',
        t0: dispatch.t0,
        deadline: dispatch.deadline,
        since: dispatch.createdAt,
        attempt: 1,
      });
  for (const entry of entries.filter((e) => e.kind === 'user-message'))
    if (
      !runs.some((r) => r.sourceId === entry.id) &&
      !entries.some((e) => e.kind === 'broker-message' && e.sourceId === entry.id)
    )
      pending.push({
        id: entry.id,
        kind: 'converse',
        t0: null,
        deadline: null,
        since: entry.createdAt,
        attempt: 0,
      });
  return pending;
}
export async function chatView(
  deps: Deps,
  userId: string | undefined,
  topic: string,
  locale: Locale,
): Promise<Chat> {
  const t = translator(locale);
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  const chats = userId ? await conversation.listConversations(deps.db, userId) : [];
  const chat = chats.find((c) => c.topic === topic);
  if (conversation.isTalk(topic) && !chat) throw new TRPCError({ code: 'NOT_FOUND' });
  const prefs = personal
    ? (await broker.loadHead(deps.db, personal.id)).preferences
    : broker.defaultPreferences();
  const journal = await journalView(deps, userId);
  const dispatches = personal ? await forecast.listDispatches(deps.db, personal.id) : [];
  const allRuns = personal ? await runtime.listRuns(deps.db, personal.id) : [];
  const entries = chat ? await conversation.readEntries(deps.db, chat.id, 0, 10000) : [];
  const portfolio = await portfolioView(deps, userId, locale);
  const cards = personal
    ? await proposalCards(deps, personal.id, portfolio.user.rows, locale)
    : new Map<string, ChatProposal & { replyTo: string }>();
  const retrying = retryingRuns(entries, allRuns, deps.clock.now());
  const items = feedItems(entries, {
    t,
    locale,
    entries: new Map(entries.map((e) => [e.id, e])),
    forecasts: new Map(journal.map((f) => [f.id, f])),
    cards,
    signals: await signalsOf(deps, entries, true),
    runs: allRuns,
    rows: portfolio.user.rows,
    retrying,
  });
  if (!chat && topic === 'broker') items.push(message('welcome', 0, t('chat.welcome')));
  const pending = pendingOf(entries, chat?.id, {
    runs: allRuns,
    dispatches,
    answered: new Set(journal.flatMap((f) => f.threadId ?? [])),
    errored: new Set(entries.filter((e) => e.kind === 'run-error').map((e) => String(e.body.runId))),
    retrying,
  });
  // An item stands for the entry it is keyed by; a line of several skipped signals, for the first of them.
  const seqOf = new Map(entries.map((e) => [e.id, e.seq]));
  const signals = topic === 'broker' ? await signalsView(deps, userId, locale) : null;
  const latestSignal = signals?.items[0];
  const live: Chat['live'] = latestSignal
    ? { ...latestSignal, kind: 'signal', view: null }
    : (signals?.quiet ?? null);
  const execution = trading.rulesFor('lower');
  const feeRate = Number(execution.feeRate);
  return {
    conversationId: chat?.id ?? null,
    seq: (chat?.nextSeq ?? 1) - 1,
    key: topic,
    title: conversation.isTalk(topic) ? talkTitle(entries, locale) : null,
    market: conversation.isGeneral(topic) ? null : await quote(deps, topic, locale),
    items,
    pending,
    model: true,
    needsLogin: false,
    unread: unreadOf(chat, entries),
    firstUnread: chat ? (items.find((i) => (seqOf.get(i.key) ?? 0) > chat.readSeq)?.key ?? null) : null,
    position:
      portfolio.user.rows.find((r) => r.coin === topic && (r.status === 'open' || r.status === 'pending')) ??
      null,
    ticket: conversation.isGeneral(topic)
      ? null
      : {
          minUsd: 1,
          maxUsd: Math.min(Number(prefs.maxTradeUsd), portfolio.user.capital / (1 + feeRate)),
          freeUsd: portfolio.user.openCount ? 0 : portfolio.user.capital,
          blockedReason:
            portfolio.user.openCount > 0
              ? 'account-busy'
              : portfolio.user.capital / (1 + feeRate) < 1
                ? 'capital'
                : null,
          stopLossPct: { min: 0.1, max: 10 },
          takeProfitPct: { min: 0.1, max: 20 },
          horizons: [MODE_HORIZON[prefs.mode]],
          feeRate,
          slippageBps: execution.slippageBps,
          costPct: 2 * (feeRate * 100 + execution.slippageBps / 100),
        },
    latestThread: dispatches.find((d) => d.instrument === topic)?.id ?? null,
    live,
    record: {
      official: qualityView(journal, 'official', 0).horizons,
      onDemand: qualityView(journal, 'on-demand', 0).horizons,
    },
  };
}
function talkTitle(entries: conversation.Entry[], locale: Locale): string {
  const text = String(entries.find((e) => e.kind === 'user-message')?.body.text ?? '')
    .split('\n')[0]!
    .trim();
  return text.length > 60 ? `${text.slice(0, 59).trimEnd()}…` : text || translator(locale)('chat.newTalk');
}
/** A forecast is previewed on the horizon the person trades; the broker's planned trade counts when it is on it. */
function previewOf(item: ChatItem, horizon: Horizon): Preview | null {
  if (item.kind === 'signal')
    return { kind: 'signal', at: item.at, move: item.move, horizon: item.horizon, direction: item.direction };
  if (item.kind === 'failed') return { kind: 'text', at: item.at, role: 'system', text: item.error ?? '' };
  if (item.kind !== 'message') return null;
  const proposal = item.proposal && { side: item.proposal.side, sizeUsd: item.proposal.sizeUsd };
  const plan = item.forecast?.plan;
  const probs = item.forecast?.horizons.find((h) => h.horizon === horizon)?.probs;
  if (plan && probs)
    return {
      kind: 'forecast',
      at: item.at,
      horizon,
      probs,
      action: plan.horizon === horizon ? plan.action : 'FLAT',
      proposal,
    };
  if (proposal) return { kind: 'proposal', at: item.at, ...proposal };
  return { kind: 'text', at: item.at, role: item.role, text: item.text };
}
// A change of settings is written into the conversation for the record, but it is not a message and is never unread.
const SILENT_KINDS: ReadonlySet<string> = new Set(['preferences']);
const unreadOf = (
  chat: { readonly nextSeq: number; readonly readSeq: number } | undefined,
  entries: readonly { readonly seq: number; readonly kind: string }[],
): number => {
  if (!chat) return 0;
  const silent = entries.filter((entry) => entry.seq > chat.readSeq && SILENT_KINDS.has(entry.kind)).length;
  return Math.max(0, chat.nextSeq - 1 - chat.readSeq - silent);
};
/** The last entries of a conversation its preview is looked for in: the latest first, then a longer run. */
const PREVIEW_WINDOWS = [8, 32];
export async function chatsView(deps: Deps, userId: string | undefined, locale: Locale): Promise<Chats> {
  const t = translator(locale);
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  const prefs = personal
    ? (await broker.loadHead(deps.db, personal.id)).preferences
    : broker.defaultPreferences();
  const chats = userId ? await conversation.listConversations(deps.db, userId) : [];
  const portfolio = await portfolioView(deps, userId, locale);
  const dispatches = personal ? await forecast.listDispatches(deps.db, personal.id) : [];
  const runs = personal ? await runtime.listRuns(deps.db, personal.id) : [];
  const recent = new Map(
    await Promise.all(
      chats.map(
        async (chat) =>
          [
            chat.id,
            await conversation.recentEntries(deps.db, chat.id, chat.nextSeq - 1, PREVIEW_WINDOWS.at(-1)),
          ] as const,
      ),
    ),
  );
  // What a window's entries refer to lies before it only for an answer: the entry it answers is fetched.
  const byId = new Map([...recent.values()].flat().map((e) => [e.id, e]));
  for (const entry of [...byId.values()])
    if (typeof entry.body.replyTo === 'string' && !byId.has(entry.body.replyTo)) {
      const source = await conversation.findEntry(deps.db, entry.body.replyTo);
      if (source) byId.set(source.id, source);
    }
  const forecasts = new Map<string, ForecastView & { threadId: string | null }>();
  const readForecasts = async (window: conversation.Entry[]) => {
    for (const entry of window) {
      const source = typeof entry.body.replyTo === 'string' ? byId.get(entry.body.replyTo) : entry;
      const id = source?.kind === 'forecast' ? source.body.forecastId : undefined;
      if (typeof id !== 'string' || forecasts.has(id)) continue;
      const value = await forecast.findForecast(deps.db, id);
      if (value) forecasts.set(id, await forecastView(deps, value));
    }
  };
  const replies = new Set(
    [...byId.values()].flatMap((e) =>
      e.kind === 'broker-message' && typeof e.body.replyTo === 'string' ? [e.body.replyTo] : [],
    ),
  );
  const cards = personal
    ? await proposalCards(deps, personal.id, portfolio.user.rows, locale, replies)
    : new Map<string, ChatProposal & { replyTo: string }>();
  const runless = dispatches.filter((d) => !runs.some((r) => r.kind === 'forecast' && r.sourceId === d.id));
  const work = {
    runs,
    dispatches,
    answered: new Set(
      (await Promise.all(runless.map((d) => forecast.findSubmission(deps.db, d.id)))).flatMap(
        (s) => s?.dispatchId ?? [],
      ),
    ),
    errored: await conversation.erroredRuns(
      deps.db,
      chats.map((c) => c.id),
      runs.filter((r) => r.state === 'pending').map((r) => r.id),
    ),
  };
  const summary = async (topic: string): Promise<Chats['broker']> => {
    const chat = chats.find((c) => c.topic === topic);
    const entries = (chat && recent.get(chat.id)) || [];
    const retrying = retryingRuns(entries, runs, deps.clock.now());
    const pending = pendingOf(entries, chat?.id, { ...work, retrying });
    let preview: Preview | null = pending.length
      ? { kind: 'busy', at: Math.max(...pending.map((p) => p.since)) }
      : null;
    for (const size of PREVIEW_WINDOWS) {
      if (preview) break;
      const window = entries.slice(-size);
      await readForecasts(window);
      const items = feedItems(window, {
        t,
        locale,
        entries: byId,
        forecasts,
        cards,
        signals: await signalsOf(deps, window, false),
        runs,
        rows: portfolio.user.rows,
        retrying,
      });
      if (!chat && topic === 'broker') items.push(message('welcome', 0, t('chat.welcome')));
      preview =
        items.map((item) => previewOf(item, MODE_HORIZON[prefs.mode])).findLast((p) => p !== null) ?? null;
    }
    return {
      key: topic,
      at: preview?.at ?? 0,
      unread: unreadOf(chat, entries),
      spoken: entries.some((e) => e.kind === 'user-message'),
      preview,
    };
  };
  return {
    status: null,
    lastSignalAt: (await market.listEvents(deps.db, 1))[0]?.barEnd ?? null,
    broker: await summary('broker'),
    talks: (
      await Promise.all(
        chats
          .filter((c) => conversation.isTalk(c.topic))
          .map(async (c) => ({
            ...(await summary(c.topic)),
            spoken: true,
            title: talkTitle(await conversation.readEntries(deps.db, c.id, 0, 1), locale),
          })),
      )
    ).sort((a, b) => b.at - a.at),
    markets: await Promise.all(
      [...new Set([...prefs.markets, ...chats.map((c) => c.topic)])]
        .filter((t) => !conversation.isGeneral(t))
        .map(async (topic) => {
          const position = portfolio.user.rows.find(
            (r) => r.coin === topic && (r.status === 'open' || r.status === 'pending'),
          );
          return {
            ...(await summary(topic)),
            ...(await quote(deps, topic, locale)),
            watched: prefs.markets.includes(topic),
            position: position
              ? { side: position.side, pnl: position.status === 'open' ? position.unrealized : null }
              : null,
          };
        }),
    ),
  };
}
