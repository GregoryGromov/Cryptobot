import { type AnalyticsPort, analyticsEventSchema } from '../platform/analytics/types.js';
import { boundedJson } from '../platform/http.js';

/** Server-only capture, with stable event UUIDs across retries and no user content. */
export function posthog(options: { key: string; host: string; fetch?: typeof fetch }): AnalyticsPort {
  const host = new URL(options.host);
  if (
    host.protocol !== 'https:' ||
    host.username ||
    host.password ||
    host.search ||
    host.hash ||
    host.pathname !== '/'
  )
    throw new Error('PostHog host must be an HTTPS origin');
  const fetcher = options.fetch ?? fetch;
  return async (input, environment, signal) => {
    const event = analyticsEventSchema.parse(input);
    try {
      const response = await fetcher(new URL('/i/v0/e/', host), {
        method: 'POST',
        redirect: 'error',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.any([AbortSignal.timeout(5000), ...(signal ? [signal] : [])]),
        body: JSON.stringify({
          token: options.key,
          event: event.name,
          uuid: event.id,
          timestamp: new Date(event.occurredAt).toISOString(),
          properties: {
            ...event.properties,
            environment,
            distinct_id: event.userId,
            $process_person_profile: false,
            $geoip_disable: true,
          },
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return response.status === 429
          ? { kind: 'retry', reason: 'rate-limited' }
          : response.status >= 500
            ? { kind: 'retry', reason: 'unavailable' }
            : { kind: 'failed', reason: 'rejected' };
      }
      const result = await boundedJson(response, 16000);
      if (!result || typeof result !== 'object') return { kind: 'retry', reason: 'unavailable' };
      if ('quota_limited' in result && Array.isArray(result.quota_limited) && result.quota_limited.length)
        return { kind: 'failed', reason: 'quota-limited' };
      if (!('status' in result) || result.status !== 1) return { kind: 'failed', reason: 'rejected' };
      return { kind: 'sent' };
    } catch {
      return { kind: 'retry', reason: 'unavailable' };
    }
  };
}
