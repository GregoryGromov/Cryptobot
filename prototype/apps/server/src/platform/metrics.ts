import { createHash, timingSafeEqual } from 'node:crypto';
import { utcDay } from '../kernel/time.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import * as runtime from '../modules/runtime/index.js';
import * as trading from '../modules/trading/index.js';
import type { Deps } from '../workflows/deps.js';
import { deliveryMetrics } from './analytics/store.js';
import { JOB_NAMES } from './jobs.js';

export function metricsAuthorized(expected: string, authorization: string | undefined) {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return authorization !== undefined && timingSafeEqual(hash(`Bearer ${expected}`), hash(authorization));
}

export async function metricsText(deps: Deps): Promise<string> {
  const now = deps.clock.now();
  const [markets, forecasts, trades, runs, coverage, quota, deliveries, worker] = await Promise.all([
    market.operationalMetrics(deps.db),
    forecast.operationalMetrics(deps.db, now),
    trading.operationalMetrics(deps.db, now),
    runtime.operationalMetrics(deps.db, now),
    conversation.dispatchCoverage(deps.db),
    runtime.quotaUsage(deps.db, 'global', utcDay(now)),
    deliveryMetrics(deps.db),
    runtime.workerReady(deps.db, now),
  ]);
  const lines: string[] = [];
  const seen = new Set<string>();
  function metric(
    name: string,
    help: string,
    value: number,
    labels: Record<string, string> = {},
    type = 'gauge',
  ) {
    if (!Number.isFinite(value)) throw new Error('Non-finite metric');
    const full = `reinforce_${name}`;
    if (!seen.has(full)) {
      lines.push(`# HELP ${full} ${help}`, `# TYPE ${full} ${type}`);
      seen.add(full);
    }
    const pairs = Object.entries({ environment: deps.config.MARKET_MODE, ...labels })
      .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
      .join(',');
    lines.push(`${full}{${pairs}} ${value}`);
  }
  metric('worker_ready', 'A worker has a recent heartbeat.', Number(worker));
  metric('market_events_total', 'Persisted market events.', markets.summary.events, {}, 'counter');
  metric(
    'market_arrival_delay_seconds_sum',
    'Sum of event arrival delay from bar end.',
    markets.summary.delaySum,
    {},
    'counter',
  );
  metric(
    'market_arrival_delay_seconds_max',
    'Largest persisted event arrival delay.',
    markets.summary.delayMax,
  );
  for (const status of ['OK', 'STALE', 'INSUFFICIENT_HISTORY', 'UNAVAILABLE', 'ERROR'])
    metric(
      'market_observations',
      'Latest source observations by upstream status; not a freshness guarantee.',
      markets.quality.find((q) => q.status === status)?.count ?? 0,
      { status },
    );
  for (const cohort of ['official', 'late', 'non-official-timing', 'on-demand'])
    metric(
      'forecasts_total',
      'Accepted forecasts by cohort.',
      forecasts.cohorts.find((c) => c.cohort === cohort)?.count ?? 0,
      { cohort },
      'counter',
    );
  for (const origin of ['event', 'on-demand'])
    metric(
      'dispatches_total',
      'Forecast dispatches by trigger.',
      forecasts.origins.find((o) => o.origin === origin)?.count ?? 0,
      { origin },
      'counter',
    );
  metric(
    'dispatch_delay_seconds_sum',
    'Sum of event-to-dispatch delay from bar end.',
    forecasts.origins.find((o) => o.origin === 'event')?.delaySum ?? 0,
    {},
    'counter',
  );
  metric(
    'forecast_response_seconds_sum',
    'Sum of dispatch-to-accepted-forecast delay.',
    forecasts.latency.seconds,
    {},
    'counter',
  );
  metric(
    'forecast_response_seconds_count',
    'Accepted responses contributing to latency.',
    forecasts.latency.count,
    {},
    'counter',
  );
  metric(
    'invalid_forecast_attempts_total',
    'Rejected forecast submissions.',
    forecasts.invalid,
    {},
    'counter',
  );
  metric(
    'unresolved_horizons',
    'Due prospective horizons without a resolution under their pinned rules.',
    forecasts.due.count,
  );
  metric('unresolved_oldest_seconds', 'Age of oldest due unresolved horizon.', forecasts.due.oldest);
  for (const outcome of ['dispatched', 'auto-off', 'data-quality', 'analysis-limit', 'other'])
    metric(
      'event_admissions_total',
      'Watched event outcomes; denominator for dispatch coverage.',
      coverage.find((c) => c.outcome === outcome)?.count ?? 0,
      { outcome },
      'counter',
    );
  metric('open_orders', 'Orders without terminal execution.', trades.count);
  metric('overdue_orders', 'Orders past their horizon without terminal execution.', trades.overdue);
  metric('overdue_order_oldest_seconds', 'Age since expiry of oldest unresolved order.', trades.oldest);
  for (const state of ['pending', 'running', 'succeeded', 'failed'])
    metric(
      'model_runs',
      'Model runs in each state.',
      runs.states.find((r) => r.state === state)?.count ?? 0,
      { state },
    );
  metric('model_expired_leases', 'Running model attempts whose lease expired.', runs.expired);
  metric('model_retries_total', 'Started model attempts after the first.', runs.retries, {}, 'counter');
  metric('model_calls_total', 'Reserved external model calls.', runs.usage.calls, {}, 'counter');
  metric(
    'model_errors_total',
    'Recorded failed or interrupted model calls.',
    runs.usage.errors,
    {},
    'counter',
  );
  metric(
    'model_cost_known_usd_total',
    'Sum of known model costs; see unknown cost count.',
    runs.usage.cost,
    {},
    'counter',
  );
  metric(
    'model_cost_unknown_calls',
    'Calls without a known provider cost, including pending calls.',
    runs.usage.unknownCost,
  );
  metric(
    'model_tokens_total',
    'Known provider token usage.',
    runs.usage.inputTokens,
    { direction: 'input' },
    'counter',
  );
  metric(
    'model_tokens_total',
    'Known provider token usage.',
    runs.usage.outputTokens,
    { direction: 'output' },
    'counter',
  );
  metric('quota_global_daily_calls', 'Global UTC-day call budget usage.', quota.spent, { state: 'spent' });
  metric('quota_global_daily_calls', 'Global UTC-day call budget usage.', quota.reserved, {
    state: 'reserved',
  });
  metric('quota_global_daily_limit', 'Configured global daily call limit.', deps.config.DAILY_GLOBAL_CALLS);
  for (const state of ['pending', 'sending', 'sent', 'failed'])
    metric(
      'analytics_deliveries',
      'Analytics outbox delivery states.',
      deliveries.find((d) => d.status === state)?.count ?? 0,
      { state },
    );
  // Public pg-boss API, current counts rather than a scrape of its private tables.
  for (const name of JOB_NAMES) {
    const [stats] = await deps.jobs.getQueueStats(name, { force: true });
    if (!stats) continue;
    metric(
      'queue_snapshot_timestamp_seconds',
      'Time of the pg-boss count snapshot (may be cached for one minute).',
      stats.capturedOn.getTime() / 1000,
      { queue: name },
    );
    for (const [state, value] of Object.entries({
      ready: stats.readyCount,
      deferred: stats.deferredCount,
      active: stats.activeCount,
      failed: stats.failedCount,
    }))
      metric(
        'queue_jobs',
        'Current retained pg-boss jobs; terminal rows are retained for seven days.',
        value,
        { queue: name, state },
      );
  }
  return `${lines.join('\n')}\n`;
}

/** A scrape burst shares one collection; failures are never cached as successful zeros. */
export function metricsReader(deps: Deps) {
  let cached: { at: number; text: string } | undefined;
  let pending: Promise<string> | undefined;
  return () => {
    if (cached && deps.clock.now() - cached.at >= 0 && deps.clock.now() - cached.at < 10000)
      return Promise.resolve(cached.text);
    pending ??= metricsText(deps)
      .then((text) => {
        cached = { at: deps.clock.now(), text };
        return text;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}
