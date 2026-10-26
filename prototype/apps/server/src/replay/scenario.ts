import {
  candleSchema,
  instantSchema,
  messageTextSchema,
  preferencesSchema,
  versionInputSchema,
} from '@reinforce/harness-contract';
import { z } from 'zod';
import { MINUTE } from '../kernel/time.js';

const key = z.string().regex(/^[a-zA-Z0-9._:-]{1,100}$/);
const common = { key, at: instantSchema, work: z.boolean().default(true) };
const snapshot = z.strictObject({
  key,
  instrument: z.string().min(1).max(100),
  cutoffAt: instantSchema,
  raw: z
    .string()
    .max(64000)
    .refine((raw) => {
      try {
        const value = JSON.parse(raw);
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      } catch {
        return false;
      }
    }, 'Snapshot must be a JSON object'),
});
const step = z.discriminatedUnion('kind', [
  z.strictObject({
    ...common,
    kind: z.literal('market'),
    candles: z.array(candleSchema).max(20000),
    snapshots: z.array(snapshot).max(100),
    events: z
      .array(
        z.strictObject({
          key,
          snapshot: key,
          barEnd: instantSchema,
          body: z.record(z.string(), z.unknown()),
        }),
      )
      .max(100),
  }),
  z.strictObject({
    ...common,
    kind: z.literal('configure'),
    prompt: versionInputSchema.shape.prompt,
    markets: preferencesSchema.shape.markets.optional(),
  }),
  z.strictObject({ ...common, kind: z.literal('forecast'), event: key }),
  z.strictObject({ ...common, kind: z.literal('discuss-forecast'), event: key }),
  z.strictObject({
    ...common,
    kind: z.literal('message'),
    topic: z.string().min(1).max(100),
    text: messageTextSchema,
    reviseFrom: key.optional(),
  }),
  z.strictObject({
    ...common,
    kind: z.literal('decide'),
    proposalFrom: key,
    decision: z.enum(['confirmed', 'declined']),
  }),
  z.strictObject({ ...common, kind: z.literal('tick') }),
]);
const recording = z.strictObject({
  operation: z.enum(['forecast', 'respond']),
  response: z.union([
    z.strictObject({
      kind: z.literal('output'),
      content: z.string().max(256000),
      model: z.string().min(1).max(100),
    }),
    z.strictObject({
      kind: z.literal('error'),
      reason: z.enum(['refused', 'rate-limited', 'unavailable', 'invalid-response']),
    }),
  ]),
});
export const scenarioSchema = z
  .strictObject({
    schemaVersion: z.literal('workflow-replay-1'),
    source: z.enum(['synthetic', 'recorded']),
    startAt: instantSchema,
    endAt: instantSchema,
    steps: z.array(step).min(1).max(10000),
    model: z.discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('synthetic') }),
      z.strictObject({ kind: z.literal('recorded'), responses: z.array(recording).max(1000) }),
    ]),
  })
  .superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (value.endAt < value.startAt || value.endAt - value.startAt > 7 * 86400000)
      fail('Scenario duration must be at most seven days');
    let previous = value.startAt;
    const steps = new Set<string>();
    const snapshots = new Map<string, z.infer<typeof snapshot>>();
    const events = new Set<string>();
    for (const item of value.steps) {
      if (item.at < previous || item.at > value.endAt) fail('Steps must follow virtual time');
      if (steps.has(item.key)) fail('Duplicate step key');
      if (
        (item.kind === 'decide' && !steps.has(item.proposalFrom)) ||
        (item.kind === 'message' && item.reviseFrom && !steps.has(item.reviseFrom))
      )
        fail('Proposal reference must point to an earlier step');
      steps.add(item.key);
      previous = item.at;
      if (item.kind === 'market') {
        if (item.candles.some((c) => c.openAt + MINUTE > item.at))
          fail('A candle must close before it becomes available');
        for (const s of item.snapshots) {
          if (snapshots.has(s.key)) fail('Duplicate snapshot key');
          if (s.cutoffAt > item.at || s.cutoffAt % MINUTE) fail('Invalid snapshot cutoff');
          snapshots.set(s.key, s);
        }
        for (const e of item.events) {
          if (events.has(e.key)) fail('Duplicate event key');
          const s = snapshots.get(e.snapshot);
          if (!s || s.cutoffAt > e.barEnd || e.barEnd > item.at || e.barEnd % MINUTE)
            fail('Event must reference an available snapshot');
          events.add(e.key);
        }
      }
      if ((item.kind === 'forecast' || item.kind === 'discuss-forecast') && !events.has(item.event))
        fail('Event must precede the model task');
    }
  });
export type ReplayScenario = z.infer<typeof scenarioSchema>;
