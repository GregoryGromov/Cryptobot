import { setTimeout as sleep } from 'node:timers/promises';
import { idSchema, versionInputSchema } from '@reinforce/harness-contract';
import { FALLBACK_LOCALE, LOCALES, type Locale, translator } from '@reinforce/i18n/server';
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CHART_FRAMES, MOST_CHART_BARS } from '../kernel/frames.js';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction } from '../platform/db.js';
import { newToken, sha256 } from '../platform/identity.js';
import { activateBrokerVersion, activationInputSchema } from '../workflows/activate-broker-version.js';
import { recordWebVisit } from '../workflows/analytics.js';
import { changeBrokerVersion } from '../workflows/change-broker-version.js';
import { changePreferences, preferencesInputSchema } from '../workflows/change-preferences.js';
import { chartHistory } from '../workflows/chart-candles.js';
import { confirmProposal } from '../workflows/confirm-proposal.js';
import { createGuest } from '../workflows/create-guest.js';
import type { Deps } from '../workflows/deps.js';
import { linkTelegram, unlinkTelegram } from '../workflows/link-telegram.js';
import { cancelLogin, LoginFailure, pendingLogin, pollLogin, startLogin } from '../workflows/login.js';
import { manualTrade, manualTradeSchema } from '../workflows/manual-trade.js';
import { chooseOwnModel, forgetOwnModel } from '../workflows/own-model.js';
import { requestForecast, requestForecastSchema } from '../workflows/request-forecast.js';
import { retryInputSchema, retryRun } from '../workflows/retry-run.js';
import { messageInputSchema, sendMessage } from '../workflows/send-message.js';
import { startConversation, startConversationSchema } from '../workflows/start-conversation.js';
import type { ConversationEvent } from './view-types.js';
import { catalogView } from './views/catalog.js';
import { analysisProgress, chatsView, chatView, signalsView } from './views/conversations.js';
import { evaluationsView } from './views/evaluations.js';
import { agentView, journalView } from './views/forecasts.js';
import { chart } from './views/market.js';
import { portfolioView, tradeRow } from './views/portfolio.js';
import { searchView } from './views/search.js';
import { pulseView, sessionView } from './views/session.js';
import { ownedDispatch, threadView } from './views/thread.js';
import { inputsView, whyView } from './views/why.js';

export type ApiContext = {
  deps: Deps;
  user: account.User | undefined;
  /** The language of the request: the server's own words in views and errors are written in it. */
  locale: Locale;
  sessionToken: string;
  rotateSession?: (token: string) => void;
};
const t = initTRPC.context<ApiContext>().create({
  sse: { ping: { enabled: true, intervalMs: 15_000 } },
  errorFormatter({ shape, error, ctx }) {
    const words = translator(ctx?.locale ?? FALLBACK_LOCALE);
    const invalid = error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError ? error.cause : null;
    const fieldErrors: Partial<Record<string, string[]>> | null =
      invalid && z.flattenError(invalid).fieldErrors;
    return {
      ...shape,
      message: invalid
        ? words('errors.invalid')
        : error.code === 'INTERNAL_SERVER_ERROR'
          ? words('errors.failed')
          : shape.message,
      data: { ...shape.data, fieldErrors },
    };
  },
});
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: translator(ctx.locale)('errors.signIn') });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
const loginProcedure = t.procedure.use(async ({ ctx, next }) => {
  const result = await next();
  const failure = result.ok ? undefined : result.error.cause;
  if (failure instanceof LoginFailure)
    throw new TRPCError({
      code:
        failure.reason === 'unavailable'
          ? 'SERVICE_UNAVAILABLE'
          : failure.reason === 'busy'
            ? 'TOO_MANY_REQUESTS'
            : 'CONFLICT',
      message: translator(ctx.locale)(`errors.login.${failure.reason}`),
      cause: failure,
    });
  return result;
});
async function personal(ctx: { deps: Deps; user: account.User }) {
  const row = await broker.findBroker(ctx.deps.db, ctx.user.id);
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  return row;
}
async function ownForecast(ctx: { deps: Deps; user: account.User }, id: string) {
  const value = await forecast.findForecast(ctx.deps.db, id);
  if (!value || value.brokerId !== (await personal(ctx)).id || value.body.schemaVersion !== '2')
    throw new TRPCError({ code: 'NOT_FOUND' });
  const dispatch = await forecast.findDispatch(ctx.deps.db, value.dispatchId);
  const snapshot = dispatch ? await market.findSnapshot(ctx.deps.db, dispatch.snapshotId) : undefined;
  if (!snapshot) throw new TRPCError({ code: 'NOT_FOUND' });
  return { value, snapshot };
}

export const appRouter = t.router({
  telegram: t.router({
    link: protectedProcedure.mutation(({ ctx }) => linkTelegram(ctx.deps, ctx.user.id)),
    unlink: protectedProcedure.mutation(({ ctx }) => unlinkTelegram(ctx.deps, ctx.user.id)),
  }),
  market: t.router({
    analyze: protectedProcedure
      .input(requestForecastSchema)
      .mutation(({ ctx, input }) => requestForecast(ctx.deps, ctx.user.id, input)),
  }),
  views: t.router({
    session: t.procedure.query(({ ctx }) => sessionView(ctx.deps, ctx.user, ctx.locale)),
    chats: t.procedure.query(({ ctx }) => chatsView(ctx.deps, ctx.user?.id, ctx.locale)),
    chat: t.procedure
      .input(z.object({ topic: z.string().min(1).max(100) }))
      .query(({ ctx, input }) => chatView(ctx.deps, ctx.user?.id, input.topic, ctx.locale)),
    portfolio: t.procedure.query(({ ctx }) => portfolioView(ctx.deps, ctx.user?.id, ctx.locale)),
    broker: t.procedure.query(({ ctx }) => agentView(ctx.deps, ctx.user?.id, ctx.locale)),
    journal: t.procedure.query(({ ctx }) => journalView(ctx.deps, ctx.user?.id)),
    search: t.procedure
      .input(z.object({ query: z.string().trim().min(2).max(100) }))
      .query(({ ctx, input }) => searchView(ctx.deps, ctx.user?.id, input.query)),
    signals: t.procedure.query(({ ctx }) => signalsView(ctx.deps, ctx.user?.id, ctx.locale)),
    catalog: t.procedure.query(({ ctx }) => catalogView(ctx.deps, ctx.user?.id, ctx.locale)),
    pulse: t.procedure.query(({ ctx }) => pulseView(ctx.deps, ctx.user, ctx.locale)),
    thread: protectedProcedure
      .input(idSchema)
      .query(({ ctx, input }) => threadView(ctx.deps, ctx.user.id, input, ctx.locale)),
    // The last hour and a half of a market, drawn while the broker reads it.
    marketChart: t.procedure.input(z.object({ coin: z.string().min(1).max(100) })).query(({ ctx, input }) => {
      const now = ctx.deps.clock.now();
      return chart(ctx.deps, input.coin, now - 90 * 60000, now);
    }),
    // A market's chart in any of its frames, for the person to look around and pick a span to ask about.
    candles: t.procedure
      .input(
        z.object({
          coin: z.string().min(1).max(100),
          frame: z.enum(CHART_FRAMES),
          bars: z.number().int().min(1).max(MOST_CHART_BARS).optional(),
        }),
      )
      .query(({ ctx, input }) => chartHistory(ctx.deps, input.coin, input.frame, input.bars)),
    threadChart: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
      const dispatch = await ownedDispatch(ctx.deps, ctx.user.id, input);
      return {
        candles: await chart(
          ctx.deps,
          dispatch.instrument,
          dispatch.t0 - 60 * 60000,
          dispatch.t0 + 60 * 60000,
        ),
        step: 1,
        historical: true,
      };
    }),
    tradeChart: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
      const order = await trading.findOrder(ctx.deps.db, input);
      const book = order ? await trading.findAccountById(ctx.deps.db, order.accountId) : null;
      if (!order || book?.userId !== ctx.user.id) throw new TRPCError({ code: 'NOT_FOUND' });
      return {
        trade: await tradeRow(ctx.deps, order, book.kind, ctx.locale),
        candles: await chart(
          ctx.deps,
          order.terms.instrument,
          order.entryAt - 30 * 60000,
          order.entryAt + order.terms.horizon * 60000,
        ),
      };
    }),
    forecastWhy: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
      const { value, snapshot } = await ownForecast(ctx, input);
      return whyView(value, snapshot, ctx.locale);
    }),
    forecastInputs: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
      const { value, snapshot } = await ownForecast(ctx, input);
      return inputsView(value, snapshot, ctx.locale);
    }),
  }),
  runtime: t.router({
    retry: protectedProcedure
      .input(retryInputSchema)
      .mutation(({ ctx, input }) => retryRun(ctx.deps, ctx.user.id, input)),
  }),
  account: t.router({
    logout: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await cancelLogin(ctx.deps, ctx.sessionToken, true);
      ctx.rotateSession?.(newToken());
      return result;
    }),
    guest: t.procedure.mutation(({ ctx }) => createGuest(ctx.deps, ctx.sessionToken, ctx.locale)),
    /** The page keeps the choice in a cookie; the account keeps it for what is written outside a request. */
    locale: t.procedure.input(z.enum(LOCALES)).mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (user) await inTransaction(ctx.deps.db, (tx) => account.setUserLocale(tx, user.id, input));
      return { ok: true } as const;
    }),
    visit: t.procedure.mutation(async ({ ctx }) => {
      if (ctx.user) await recordWebVisit(ctx.deps, ctx.user);
      return { ok: true } as const;
    }),
    grok: t.router({
      pending: loginProcedure.query(({ ctx }) => pendingLogin(ctx.deps, ctx.sessionToken)),
      start: loginProcedure.mutation(({ ctx }) => startLogin(ctx.deps, ctx.sessionToken)),
      status: loginProcedure.mutation(async ({ ctx }) => {
        const result = await pollLogin(ctx.deps, ctx.sessionToken, ctx.locale);
        if (result.status === 'pending') return result;
        if (result.sessionToken) ctx.rotateSession?.(result.sessionToken);
        return { status: result.status, chat: result.chat };
      }),
      cancel: loginProcedure.mutation(({ ctx }) => cancelLogin(ctx.deps, ctx.sessionToken)),
    }),
    model: t.router({
      choose: protectedProcedure
        .input(z.object({ route: z.enum(['own', 'free']) }))
        .mutation(({ ctx, input }) => chooseOwnModel(ctx.deps, ctx.user.id, input.route === 'own')),
      disconnect: protectedProcedure.mutation(({ ctx }) => forgetOwnModel(ctx.deps, ctx.user.id)),
    }),
  }),
  broker: t.router({
    activate: protectedProcedure
      .input(activationInputSchema)
      .mutation(({ ctx, input }) => activateBrokerVersion(ctx.deps, ctx.user.id, input)),
    saveVersion: protectedProcedure
      .input(versionInputSchema)
      .mutation(({ ctx, input }) => changeBrokerVersion(ctx.deps, ctx.user.id, input)),
    preferences: protectedProcedure
      .input(preferencesInputSchema)
      .mutation(({ ctx, input }) => changePreferences(ctx.deps, ctx.user.id, input)),
  }),
  conversation: t.router({
    start: protectedProcedure
      .input(startConversationSchema)
      .mutation(({ ctx, input }) => startConversation(ctx.deps, ctx.user.id, input)),
    send: protectedProcedure
      .input(messageInputSchema)
      .mutation(({ ctx, input }) => sendMessage(ctx.deps, ctx.user.id, input)),
    read: protectedProcedure
      .input(z.object({ id: idSchema, seq: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
        if (!(await conversation.findConversation(ctx.deps.db, input.id, ctx.user.id)))
          throw new TRPCError({ code: 'NOT_FOUND' });
        await inTransaction(ctx.deps.db, (tx) => conversation.markRead(tx, input.id, input.seq));
        return { ok: true };
      }),
    events: protectedProcedure
      .input(z.object({ id: idSchema, after: z.number().int().min(0) }))
      .subscription(async function* ({ ctx, input, signal }): AsyncGenerator<ConversationEvent> {
        const { deps, user } = ctx;
        if (!(await conversation.findConversation(deps.db, input.id, user.id)))
          throw new TRPCError({ code: 'NOT_FOUND', message: translator(ctx.locale)('errors.chatNotFound') });
        let seq = input.after;
        // What the broker is writing is looked at four times a second, so that it reads as typed; the rest once a second,
        // and as often while he writes, so that his answer follows the last of the draft at once.
        let shown = '';
        let analysed = '';
        for (let tick = 0; !signal?.aborted && !deps.shutdown?.aborted; tick++) {
          if (tick % 4 === 0 || shown || analysed) {
            if (!(await account.findSession(deps.db, sha256(ctx.sessionToken), deps.clock.now()))) return;
            const chat = await conversation.findConversation(deps.db, input.id, user.id);
            if (!chat) return;
            if (chat.nextSeq - 1 > seq) {
              seq = chat.nextSeq - 1;
              yield { kind: 'entries', latest: seq };
            }
          }
          const draft = await conversation.findDraft(deps.db, input.id);
          const now = draft ? `${draft.runId}:${draft.updatedAt}` : '';
          if (now !== shown) {
            shown = now;
            yield {
              kind: 'draft',
              draft: draft ? { runId: draft.runId, sourceId: draft.sourceId, text: draft.text } : null,
            };
          }
          const progress = await forecast.listProgress(deps.db, input.id);
          const analysing = progress.map((p) => `${p.dispatchId}:${p.updatedAt}`).join(',');
          if (analysing !== analysed) {
            analysed = analysing;
            yield { kind: 'analysis', progress: progress.map(analysisProgress) };
          }
          await sleep(250, undefined, signal && { signal }).catch(() => {});
        }
      }),
  }),
  trading: t.router({
    manual: protectedProcedure
      .input(manualTradeSchema)
      .mutation(({ ctx, input }) => manualTrade(ctx.deps, ctx.user.id, input)),
    confirm: protectedProcedure
      .input(z.object({ versionId: idSchema, decision: z.enum(['confirmed', 'declined']) }))
      .mutation(({ ctx, input }) => confirmProposal(ctx.deps, ctx.user.id, input)),
  }),
  evaluations: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const value = await forecast.findForecast(ctx.deps.db, input);
    if (!value || value.brokerId !== (await personal(ctx)).id) throw new TRPCError({ code: 'NOT_FOUND' });
    return evaluationsView(ctx.deps, value);
  }),
});
export type AppRouter = typeof appRouter;
