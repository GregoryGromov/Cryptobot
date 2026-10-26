import type { ModelPort } from '../adapters/model.js';
import type { TelegramPort } from '../adapters/telegram.js';
import type { AnalyticsPort } from '../platform/analytics/types.js';
import { jobPayloadSchema } from '../platform/jobs.js';
import { logger } from '../platform/log.js';
import { advanceBroker } from '../workflows/advance-broker.js';
import { sendAnalytics } from '../workflows/analytics.js';
import type { Deps } from '../workflows/deps.js';
import { dispatchMarketEvent } from '../workflows/dispatch-market-event.js';
import { executeOrder } from '../workflows/execute-order.js';
import { resolveForecast } from '../workflows/resolve-forecast.js';
import { respond } from '../workflows/respond.js';
import { runForecast } from '../workflows/run-forecast.js';
import { sendTelegram } from '../workflows/send-telegram.js';
import { settlePosition } from '../workflows/settle-position.js';

export async function startWorkers(
  deps: Deps,
  model: ModelPort,
  telegram?: TelegramPort,
  analytics?: AnalyticsPort,
): Promise<void> {
  const handlers = {
    ...(analytics ? { 'analytics.send': (id: string) => sendAnalytics(deps, analytics, id) } : {}),
    ...(telegram ? { 'notification.send': (id: string) => sendTelegram(deps, telegram, id) } : {}),
    'market.dispatch': (id: string) => dispatchMarketEvent(deps, id),
    'forecast.run': (id: string) => runForecast(deps, model, id),
    'conversation.respond': (id: string) => respond(deps, model, id),
    'broker.advance': (id: string) => advanceBroker(deps, id),
    'trade.execute': (id: string) => executeOrder(deps, id),
    'forecast.resolve': (id: string) => resolveForecast(deps, id),
    'position.settle': (id: string) => settlePosition(deps, id),
  };
  for (const [name, handler] of Object.entries(handlers)) {
    await deps.jobs.work(name, { localConcurrency: 2, pollingIntervalSeconds: 0.5 }, async (jobs) => {
      for (const job of jobs) {
        const started = performance.now();
        let outcome = 'failed';
        try {
          const result = await handler(jobPayloadSchema.parse(job.data).id);
          outcome =
            result && typeof result === 'object' && 'kind' in result && typeof result.kind === 'string'
              ? result.kind
              : 'completed';
        } finally {
          logger.info(
            {
              jobId: job.id,
              queue: name,
              attempt: job.retryCount + 1,
              durationMs: Math.round(performance.now() - started),
              outcome,
            },
            'job',
          );
        }
      }
    });
  }
}
