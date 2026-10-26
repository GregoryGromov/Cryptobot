import { z } from 'zod';

export const eventNameSchema = z.enum([
  'broker_created',
  'conversation_message',
  'broker_configured',
  'analysis_requested',
  'forecast_created',
  'proposal_created',
  'proposal_confirmed',
  'proposal_declined',
  'manual_trade_submitted',
  'trade_result',
  'forecast_resolved',
  'human_active',
  'user_returned',
]);
export type EventName = z.infer<typeof eventNameSchema>;
// Closed allowlist: never spread journal bodies, URLs, provider errors or browser metadata.
export const analyticsPropertiesSchema = z.strictObject({
  actor: z.enum(['human', 'background']),
  surface: z.enum(['journal', 'web']),
  topic: z.enum(['general', 'market']).optional(),
  account: z.enum(['user', 'broker']).optional(),
  cohort: z.enum(['official', 'late', 'non-official-timing', 'on-demand']).optional(),
  horizon: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]).optional(),
});
export type AnalyticsProperties = z.infer<typeof analyticsPropertiesSchema>;
export const analyticsEventSchema = z.strictObject({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: eventNameSchema,
  properties: analyticsPropertiesSchema,
  occurredAt: z.number().int().nonnegative().max(8.64e15),
});
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsResult =
  | { kind: 'sent' }
  | { kind: 'retry' | 'failed'; reason: 'unavailable' | 'rate-limited' | 'rejected' | 'quota-limited' };
export type AnalyticsPort = (
  event: AnalyticsEvent,
  environment: 'live' | 'replay',
  signal?: AbortSignal,
) => Promise<AnalyticsResult>;
