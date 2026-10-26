import { candleSchema, HORIZONS, horizonSchema, idSchema, instantSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { MINUTE } from '../../../kernel/time.js';
import { canonical, sha256 } from '../../../platform/identity.js';
import { BASELINE_RULES, buildBaseline } from './baseline.js';
import { scoringRulesSchema } from './scoring.js';

const row = z.strictObject({ id: idSchema, candle: candleSchema });
const caseSchema = z
  .strictObject({
    id: idSchema,
    source: z.enum(['live', 'replay']),
    origin: z.enum(['event', 'on-demand']),
    cohort: z.enum(['official', 'late', 'non-official-timing', 'on-demand']),
    instrument: z.string().min(1).max(100),
    t0: instantSchema,
    snapshot: z.strictObject({
      id: z.string().min(1).max(200),
      cutoffAt: instantSchema,
      raw: z.string().max(2_000_000),
      inputHash: z.string().regex(/^[a-f0-9]{64}$/),
    }),
    rules: scoringRulesSchema,
    history: z.array(row).max(20000),
    baselines: z
      .array(
        z.strictObject({
          horizon: horizonSchema,
          cutoff: instantSchema,
          version: z.literal(BASELINE_RULES.version),
          n: z.number().int().nonnegative(),
          candleIds: z.array(idSchema).max(20000),
        }),
      )
      .length(4),
    outcomes: z
      .array(z.strictObject({ horizon: horizonSchema, reference: row.nullable(), outcome: row.nullable() }))
      .length(4),
  })
  .superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    try {
      const body = JSON.parse(value.snapshot.raw);
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Snapshot must be an object');
      if (sha256(value.snapshot.raw) !== value.snapshot.inputHash) fail('Snapshot hash mismatch');
    } catch {
      fail('Invalid snapshot JSON');
    }
    if (value.snapshot.cutoffAt >= value.t0 || value.t0 % MINUTE) fail('Invalid fixture timing');
    if (new Set(value.history.map((r) => r.id)).size !== value.history.length)
      fail('Duplicate history identity');
    if (
      value.history.some(
        (r) => r.candle.instrument !== value.instrument || r.candle.openAt + MINUTE > value.snapshot.cutoffAt,
      )
    )
      fail('Future or foreign history');
    for (const horizon of HORIZONS) {
      const baselines = value.baselines.filter((b) => b.horizon === horizon);
      const outcomes = value.outcomes.filter((o) => o.horizon === horizon);
      if (baselines.length !== 1 || outcomes.length !== 1) {
        fail('Each horizon must occur once');
        continue;
      }
      const baseline = baselines[0]!;
      if (baseline.cutoff !== value.snapshot.cutoffAt) fail('Baseline cutoff mismatch');
      const ids = new Set(baseline.candleIds);
      const rows = value.history.filter((r) => ids.has(r.id));
      const rebuilt = buildBaseline(rows, horizon, baseline.cutoff, value.rules);
      if (
        rebuilt.n !== baseline.n ||
        canonical(rebuilt.candleIds) !== canonical([...baseline.candleIds].sort())
      )
        fail('Baseline cannot be reproduced');
      const result = outcomes[0]!;
      if (
        result.reference &&
        (result.reference.candle.instrument !== value.instrument ||
          result.reference.candle.openAt !== value.t0 - MINUTE)
      )
        fail('Invalid reference price');
      if (
        result.outcome &&
        (result.outcome.candle.instrument !== value.instrument ||
          result.outcome.candle.openAt !== value.t0 + (horizon - 1) * MINUTE)
      )
        fail('Invalid outcome price');
    }
  });
export const fixtureSchema = z
  .strictObject({
    schemaVersion: z.literal('recorded-market-1'),
    recordedAt: instantSchema,
    cases: z.array(caseSchema).min(1).max(100),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.cases.map((c) => c.id)).size !== value.cases.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate case' });
    if (
      value.cases.some((c) =>
        c.outcomes.some((o) => o.outcome && o.outcome.candle.openAt + MINUTE > value.recordedAt),
      )
    )
      ctx.addIssue({ code: 'custom', message: 'Outcome not yet closed when recorded' });
  });
export type MarketFixture = z.infer<typeof fixtureSchema>;
