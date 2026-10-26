import { setTimeout as sleep } from 'node:timers/promises';
import { serve } from '@hono/node-server';
import { atpSignal } from './adapters/atp-signal.js';
import { hyperliquid } from './adapters/hyperliquid.js';
import { hyperliquidStats } from './adapters/hyperliquid-stats.js';
import { openRouter } from './adapters/model.js';
import { posthog } from './adapters/posthog.js';
import { pollReplayMarket } from './adapters/replay-market.js';
import { replayModel, typingModel } from './adapters/replay-model.js';
import { telegramApi } from './adapters/telegram.js';
import { xaiAuth } from './adapters/xai-auth.js';
import { grokCli } from './adapters/xai-model.js';
import { createApp } from './api/app.js';
import * as runtime from './modules/runtime/index.js';
import { systemClock } from './platform/clock.js';
import { parseConfig, usesHttpMarket } from './platform/config.js';
import { openDatabase } from './platform/db.js';
import { newId } from './platform/identity.js';
import { makeJobs } from './platform/jobs.js';
import { logger } from './platform/log.js';
import { migrateDatabase } from './platform/migrate.js';
import { startWorkers } from './worker/index.js';
import { queueJournalAnalytics, recoverAnalytics } from './workflows/analytics.js';
import { feedWatch, followEvents } from './workflows/follow-events.js';
import { pollHttpMarket } from './workflows/refresh-market.js';
import { queueTelegramJournal } from './workflows/send-telegram.js';

const config = parseConfig(process.env);
if (config.ROLE === 'migrate') {
  await migrateDatabase(config.MIGRATION_DATABASE_URL ?? config.DATABASE_URL);
} else {
  const database = openDatabase(config.DATABASE_URL, `reinforce-${config.ROLE}`);
  await runtime.bindEnvironment(database.db, config.MARKET_MODE);
  const jobs = makeJobs(config.DATABASE_URL);
  jobs.on('error', (error) => logger.error({ errorType: error.name }, 'queue-failed'));
  await jobs.start();
  const shutdownSignal = new AbortController();
  const deps = {
    db: database.db,
    jobs,
    clock: systemClock,
    config,
    shutdown: shutdownSignal.signal,
    ...(usesHttpMarket(config)
      ? {
          marketSource: atpSignal({ url: config.ATP_SIGNAL_URL!, token: config.ATP_SIGNAL_TOKEN! }),
        }
      : {}),
    // The demo replays recorded minutes; live exchange minutes would contradict them.
    ...(config.MARKET_MODE === 'live'
      ? { exchangeCandles: hyperliquid(), exchangeStats: hyperliquidStats() }
      : {}),
    ...(config.XAI_CLIENT_ID
      ? {
          xaiAuth: xaiAuth({
            clientId: config.XAI_CLIENT_ID,
            ...(config.XAI_CLIENT_SECRET ? { clientSecret: config.XAI_CLIENT_SECRET } : {}),
            ownModel: config.XAI_OWN_MODEL === 'on',
          }),
        }
      : {}),
    ...(config.XAI_OWN_MODEL === 'on' ? { ownModel: grokCli() } : {}),
  };
  const workerId = newId();
  const analytics = config.POSTHOG_KEY
    ? posthog({ key: config.POSTHOG_KEY, host: config.POSTHOG_HOST })
    : undefined;
  let analyticsTick: ReturnType<typeof setInterval> | undefined;
  let analyzing: Promise<unknown> | null = null;
  const telegram = config.TELEGRAM_BOT_TOKEN ? telegramApi(config.TELEGRAM_BOT_TOKEN) : undefined;
  let notificationTick: ReturnType<typeof setInterval> | undefined;
  let notifications: Promise<unknown> | null = null;
  let heartbeatTick: ReturnType<typeof setInterval> | undefined;
  let heartbeat: Promise<void> | null = null;
  const model =
    config.MODEL_MODE === 'replay'
      ? typingModel(replayModel, config.REPLAY_TYPING_MS, config.REPLAY_THINK_MS)
      : openRouter(
          config.OPENROUTER_API_KEY!,
          fetch,
          config.OPENROUTER_FALLBACK_MODELS,
          config.MODEL_SILENCE_MS,
        );
  if (config.ROLE === 'worker' || config.ROLE === 'all') {
    await startWorkers(deps, model, telegram, analytics);
    // Enabling analytics backfills retained journal entries; no public SDK or autocapture.
    const pollAnalytics = () => {
      if (analyzing) return;
      analyzing = queueJournalAnalytics(deps)
        .then(() => recoverAnalytics(deps))
        .catch((error: Error) => logger.error({ errorType: error.name }, 'analytics-poll-failed'))
        .finally(() => {
          analyzing = null;
        });
    };
    if (analytics) {
      pollAnalytics();
      analyticsTick = setInterval(pollAnalytics, 5000);
    }
    if (telegram) {
      await queueTelegramJournal(deps);
      notificationTick = setInterval(() => {
        if (notifications) return;
        notifications = queueTelegramJournal(deps)
          .catch((error: Error) => logger.error({ errorType: error.name }, 'notification-poll-failed'))
          .finally(() => {
            notifications = null;
          });
      }, 1000);
    }
    await runtime.heartbeat(database.db, workerId, systemClock.now());
    heartbeatTick = setInterval(() => {
      if (heartbeat) return;
      heartbeat = runtime
        .heartbeat(database.db, workerId, systemClock.now())
        .catch((error: Error) => logger.error({ errorType: error.name }, 'worker-heartbeat-failed'))
        .finally(() => {
          heartbeat = null;
        });
    }, 10000);
  }
  let marketTick: ReturnType<typeof setInterval> | undefined;
  let polling: Promise<unknown> | null = null;
  let following: Promise<void> | null = null;
  if (config.ROLE === 'worker' || config.ROLE === 'all') {
    const pollMarket = usesHttpMarket(config) ? pollHttpMarket : pollReplayMarket;
    await pollMarket(deps);
    marketTick = setInterval(() => {
      if (polling) return;
      polling = pollMarket(deps)
        .catch((error: Error) => logger.error({ errorType: error.name }, 'market-poll-failed'))
        .finally(() => {
          polling = null;
        });
    }, 2000);
    // The feed answers as soon as an event is committed, so it is long-polled apart from the two-second tick.
    if (usesHttpMarket(config))
      following = (async () => {
        const watch = feedWatch();
        while (!shutdownSignal.signal.aborted) {
          const result = await followEvents(deps, 20000).catch((error: Error) => {
            logger.error({ errorType: error.name }, 'market-feed-failed');
            return { kind: 'failed', reason: error.name } as const;
          });
          const note = watch(result, deps.clock.now());
          if (note) logger[note.level](note.fields, note.msg);
          if (result.kind !== 'updated' && result.kind !== 'gap')
            await sleep(2000, undefined, { signal: shutdownSignal.signal }).catch(() => {});
        }
      })();
  }
  const server =
    config.ROLE === 'api' || config.ROLE === 'all'
      ? serve({ fetch: createApp(deps).fetch, port: config.PORT, hostname: config.HOST })
      : undefined;
  logger.info({ role: config.ROLE, port: config.PORT, environment: config.MARKET_MODE }, 'started');
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 15000);
    deadline.unref();
    shutdownSignal.abort();
    if (heartbeatTick) clearInterval(heartbeatTick);
    if (marketTick) clearInterval(marketTick);
    if (notificationTick) clearInterval(notificationTick);
    if (analyticsTick) clearInterval(analyticsTick);
    await Promise.all([heartbeat, polling, following, notifications, analyzing]);
    await runtime.stopHeartbeat(database.db, workerId);
    const closed = server ? new Promise<void>((resolve) => server.close(() => resolve())) : Promise.resolve();
    if (server && 'closeIdleConnections' in server) server.closeIdleConnections();
    await jobs.stop({ timeout: 10000 });
    await closed;
    await database.close();
    clearTimeout(deadline);
  };
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
}
