import { join } from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import { LOCALE_COOKIE, type Locale, translator } from '@reinforce/i18n/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie } from 'hono/cookie';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';
import { telegramSecretMatches } from '../adapters/telegram.js';
import * as account from '../modules/account/index.js';
import * as runtime from '../modules/runtime/index.js';
import { newId, newToken, sha256 } from '../platform/identity.js';
import { logger } from '../platform/log.js';
import { metricsAuthorized, metricsReader } from '../platform/metrics.js';
import type { Deps } from '../workflows/deps.js';
import { telegramAvailable } from '../workflows/link-telegram.js';
import { receiveTelegram } from '../workflows/receive-telegram.js';
import { requestLocale } from './locale.js';
import { appRouter } from './router.js';

export function createApp(deps: Deps) {
  const readMetrics = metricsReader(deps);
  const app = new Hono<{
    Variables: { sessionToken: string; user: account.User | undefined; locale: Locale };
  }>();
  app.use('*', secureHeaders());
  app.use('*', bodyLimit({ maxSize: 64 * 1024 }));
  app.use('*', async (c, next) => {
    const start = performance.now();
    const requestId = newId();
    try {
      await next();
    } finally {
      c.header('x-request-id', requestId);
      logger.info(
        {
          requestId,
          method: c.req.method,
          path: new URL(c.req.url).pathname,
          status: c.res.status,
          durationMs: Math.round(performance.now() - start),
        },
        'request',
      );
    }
  });
  app.use('*', async (c, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      const origin = c.req.header('origin');
      if (origin && origin !== new URL(deps.config.PUBLIC_URL).origin)
        return c.json({ error: 'Origin is not allowed' }, 403);
      if (c.req.header('sec-fetch-site') === 'cross-site')
        return c.json({ error: 'Cross-site request rejected' }, 403);
    }
    await next();
  });
  app.get('/healthz', (c) => c.json({ status: 'alive', environment: deps.config.MARKET_MODE }));
  app.get('/metrics', async (c) => {
    c.header('cache-control', 'no-store');
    if (!deps.config.METRICS_TOKEN) return c.text('Not found', 404);
    if (!metricsAuthorized(deps.config.METRICS_TOKEN, c.req.header('authorization')))
      return c.text('Unauthorized', 401);
    c.header('content-type', 'text/plain; version=0.0.4; charset=utf-8');
    return c.body(await readMetrics());
  });
  app.get('/readyz', async (c) => {
    if (deps.shutdown?.aborted) return c.json({ status: 'draining' }, 503);
    await deps.db.execute(sql`select 1`);
    if (!(await runtime.workerReady(deps.db, deps.clock.now())))
      return c.json({ status: 'worker-unavailable' }, 503);
    return c.json({ status: 'ready' });
  });
  app.post('/api/telegram/webhook', async (c) => {
    if (!telegramAvailable(deps)) return c.json({ error: 'Unavailable' }, 503);
    if (
      !telegramSecretMatches(
        deps.config.TELEGRAM_WEBHOOK_SECRET!,
        c.req.header('x-telegram-bot-api-secret-token'),
      )
    )
      return c.json({ error: 'Unauthorized' }, 401);
    const result = await receiveTelegram(deps, await c.req.json());
    return c.json(result.webhookReply ?? { ok: true });
  });
  app.use('*', async (c, next) => {
    let token = getCookie(c, 'reinforce_session');
    const issueCookie = !token || !/^[A-Za-z0-9_-]{43}$/.test(token);
    if (issueCookie) token = newToken();
    if (!token) throw new Error('Session token missing');
    c.set('sessionToken', token);
    const user = await account.findSession(deps.db, sha256(token), deps.clock.now());
    c.set('user', user);
    c.set('locale', requestLocale(getCookie(c, LOCALE_COOKIE), user, c.req.header('accept-language')));
    await next();
    // Raw tRPC Responses do not inherit Hono's prepared headers; append to the completed response.
    const outgoingToken = c.get('sessionToken');
    if (issueCookie || outgoingToken !== token)
      setCookie(c, 'reinforce_session', outgoingToken, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: deps.config.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 86400,
      });
  });
  app.use('/trpc/*', async (c, next) => {
    await next();
    c.header('cache-control', 'no-store');
  });
  app.all('/trpc/*', (c) =>
    fetchRequestHandler({
      endpoint: '/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext: () => ({
        deps,
        user: c.get('user'),
        locale: c.get('locale'),
        sessionToken: c.get('sessionToken'),
        rotateSession: (token: string) => c.set('sessionToken', token),
      }),
      onError: ({ error, path }) => logger.error({ path, code: error.code }, 'rpc-failed'),
    }),
  );
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));
  if (deps.config.WEB_ROOT) {
    app.get('*', serveStatic({ root: deps.config.WEB_ROOT }));
    app.get('*', serveStatic({ path: join(deps.config.WEB_ROOT, 'index.html') }));
  }
  app.onError((error, c) => {
    // An error before the session middleware leaves no locale; the browser's language then applies.
    const locale: Locale | undefined = c.get('locale');
    const t = translator(
      locale ?? requestLocale(getCookie(c, LOCALE_COOKIE), undefined, c.req.header('accept-language')),
    );
    if (error instanceof z.ZodError) return c.json({ error: t('errors.invalid') }, 400);
    logger.error({ errorType: error.name }, 'request-failed');
    return c.json({ error: t('errors.failed') }, 500);
  });
  return app;
}
