import { z } from 'zod';

export const HORIZONS = [5, 15, 30, 60] as const;
export const horizonSchema = z.union(HORIZONS.map((value) => z.literal(value)));
export type Horizon = z.infer<typeof horizonSchema>;
const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;
export const decimalSchema = z.string().regex(decimalPattern).max(60);
// Exact comparison at the contract boundary, including prices beyond Number's precision.
function scaled(value: string): bigint {
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = (negative ? value.slice(1) : value).split('.');
  return BigInt(`${whole}${fraction.padEnd(18, '0')}`) * (negative ? -1n : 1n);
}
export const positiveDecimalSchema = decimalSchema.refine((value) => Number(value) > 0, 'Must be positive');
export const instantSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const idSchema = z.string().uuid();

/**
 * The odds of a horizon are one of the 66 ways to split ten tenths between up, flat and down. The schema the model is
 * given lists them all, so structured output can give neither a value off the grid nor a sum other than 1: told only
 * in words, a model answered 0.15 now and then, and thinking briefly it summed to 1.1.
 */
const SPLITS = Array.from({ length: 11 }, (_, up) =>
  Array.from({ length: 11 - up }, (_, flat) => [up / 10, flat / 10, (10 - up - flat) / 10] as const),
).flat();
export const probabilitiesSchema = z.union(
  SPLITS.map(([up, flat, down]) =>
    z.strictObject({ up: z.literal(up), flat: z.literal(flat), down: z.literal(down) }),
  ),
);

const horizonForecastSchema = z
  .strictObject({
    horizon: horizonSchema,
    probabilities: probabilitiesSchema,
    expectedReturnPct: z.number().finite(),
    quantiles: z.strictObject({
      q10: z.number().finite(),
      q50: z.number().finite(),
      q90: z.number().finite(),
    }),
  })
  .superRefine((value, ctx) => {
    const { q10, q50, q90 } = value.quantiles;
    const bounds: Record<Horizon, number> = { 5: 10, 15: 15, 30: 20, 60: 30 };
    if (q10 > q50 || q50 > q90) ctx.addIssue({ code: 'custom', message: 'Quantiles must be ordered' });
    if ([q10, q50, q90, value.expectedReturnPct].some((x) => Math.abs(x) > bounds[value.horizon])) {
      ctx.addIssue({ code: 'custom', message: 'Return exceeds the horizon bound' });
    }
  });

export const tradePlanSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('FLAT'), sizePct: z.literal(0), horizon: horizonSchema }),
  z.strictObject({
    action: z.enum(['LONG', 'SHORT']),
    sizePct: z.number().int().min(10).max(100).multipleOf(10),
    horizon: horizonSchema,
    stopPct: z.number().min(0.1).max(10),
    targetPct: z.number().min(0.1).max(20),
  }),
]);

/**
 * A price the platform reads off the snapshot by name, so that a line on a picture is never a number the model wrote:
 * the volume-weighted average, the Bollinger band, the high and low of the two hours of candles.
 */
export const LEVELS = [
  'vwap',
  'bollinger_upper',
  'bollinger_middle',
  'bollinger_lower',
  'high_120m',
  'low_120m',
] as const;
export const levelSchema = z
  .enum(LEVELS)
  .describe('A price read off the snapshot: VWAP, a Bollinger band line, or the 120-minute high or low.');
export type Level = z.infer<typeof levelSchema>;
/** Indicators that have a scale of their own, drawn with where they were 15 and 5 minutes ago and their hour's range. */
export const SCALES = ['rsi', 'stochastic', 'mfi', 'adx', 'bollinger', 'donchian'] as const;
const pathSchema = z
  .string()
  .min(1)
  .max(300)
  .describe(
    'Exact existing dot path to a number, relative to the market object, without a market. prefix. Example: engineered_features.event_shock.shock_multiple_5m',
  );
const windowSchema = z.union([z.literal(5), z.literal(15), z.literal(30)]);
/**
 * What a point is shown with. The model picks a kind and where its data lies; the platform takes every number from the
 * frozen snapshot and draws it, so pictures look the same for every broker and cannot carry a made-up figure.
 */
// A plain union, not a discriminated one: it becomes anyOf in JSON Schema, which structured output takes.
export const exhibitSchema = z.union([
  z
    .strictObject({
      kind: z.literal('price'),
      minutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
      span: z
        .number()
        .int()
        .min(1)
        .max(30)
        .nullable()
        .describe('The last minutes before the forecast to mark on the line, or null.'),
      volume: z.boolean().describe('Show volume under the price, with the usual volume of a minute.'),
      levels: z.array(levelSchema).max(2),
    })
    .describe('Price of the last minutes before the forecast.'),
  z
    .strictObject({ kind: z.literal('ratio'), path: pathSchema })
    .describe(
      'How many times larger than usual: a *_multiple_*, *_vs_7d_median_* or rv_regime_ratio_* field.',
    ),
  z
    .strictObject({ kind: z.literal('scale'), indicator: z.enum(SCALES) })
    .describe('An indicator on its own scale, now, 5 and 15 minutes ago, and its range over the hour.'),
  z
    .strictObject({ kind: z.literal('breadth'), minutes: windowSchema })
    .describe('How many markets went up and down over these minutes.'),
  z
    .strictObject({ kind: z.literal('compare'), minutes: windowSchema })
    .describe('This market against BTC, ETH and the median market over these minutes.'),
  z
    .strictObject({ kind: z.literal('number'), path: pathSchema })
    .describe('One number, when no picture fits.'),
]);
export type Exhibit = z.infer<typeof exhibitSchema>;
const plain = (max: number, what: string) => z.string().trim().min(1).max(max).describe(what);
export const pointSchema = z.strictObject({
  claim: plain(
    140,
    'One thought in plain words for someone who does not trade. No numbers and no field names.',
  ),
  stance: z
    .enum(['up', 'down', 'flat', 'risk'])
    .describe('What the point speaks for: a rise, a fall, a flat price, or only more uncertainty.'),
  weight: z.enum(['high', 'medium', 'low']),
  horizons: z.array(horizonSchema).min(1).max(4).describe('The horizons this point matters for.'),
  show: exhibitSchema,
});
export type Point = z.infer<typeof pointSchema>;

export const forecastSchema = z
  .strictObject({
    schemaVersion: z.literal('2'),
    dispatchId: idSchema,
    brokerVersionId: idSchema,
    snapshotId: z.string().min(1).max(200),
    inputHash: z.string().regex(/^[a-f0-9]{64}$/),
    horizons: z.array(horizonForecastSchema).length(4),
    trade: tradePlanSchema,
    rationale: z.strictObject({
      headline: plain(120, 'The call over all four horizons in one short sentence, plain words.'),
      thesis: plain(600, 'Why, in two or three plain sentences, as said to the owner.'),
      horizons: z
        .array(
          z.strictObject({
            horizon: horizonSchema,
            note: plain(160, 'What is particular about this horizon, in one plain sentence.'),
          }),
        )
        .max(4),
      points: z.array(pointSchema).min(1).max(6),
      invalidation: z
        .strictObject({ when: z.enum(['below', 'above']), level: levelSchema })
        .nullable()
        .describe('The price beyond which the call no longer holds, or null.'),
      chart: z
        .array(
          z.strictObject({
            level: levelSchema,
            label: plain(40, 'What the line is, in two or three words.'),
          }),
        )
        .max(1)
        .describe('A line on the main price chart, only when the call cannot be read without it.'),
    }),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.horizons.map((h) => h.horizon)).size !== 4) {
      ctx.addIssue({
        code: 'custom',
        path: ['horizons'],
        message: 'Every mandatory horizon must occur once',
      });
    }
    const notes = value.rationale.horizons.map((h) => h.horizon);
    if (new Set(notes).size !== notes.length)
      ctx.addIssue({ code: 'custom', path: ['rationale', 'horizons'], message: 'One note per horizon' });
  });

export type ForecastSubmission = z.infer<typeof forecastSchema>;
export type TradePlan = z.infer<typeof tradePlanSchema>;

export const proposalTermsSchema = z.strictObject({
  instrument: z.string().min(1).max(100),
  side: z.enum(['LONG', 'SHORT']),
  amount: positiveDecimalSchema,
  stopPct: z.number().min(0.1).max(10),
  targetPct: z.number().min(0.1).max(20),
  horizon: horizonSchema,
});
export type ProposalTerms = z.infer<typeof proposalTermsSchema>;

export const replySchema = z.strictObject({
  text: z.string().trim().min(1).max(12000),
  proposal: proposalTermsSchema.nullable(),
  // What the person would most likely ask next, in their own words: shown as buttons under the answer. Answers
  // recorded before it existed have none.
  followUps: z.array(z.string().trim().min(1).max(120)).max(3).default([]),
  // The markets an answer outside a market's own conversation is about, by ticker: the person goes on with them there.
  handoff: z.array(z.string().trim().min(1).max(40)).max(2).default([]),
});
export type BrokerReply = z.infer<typeof replySchema>;

export const candleSchema = z
  .strictObject({
    instrument: z.string().min(1).max(100),
    openAt: instantSchema.refine((value) => value % 60_000 === 0, 'Minute boundary required'),
    open: positiveDecimalSchema,
    high: positiveDecimalSchema,
    low: positiveDecimalSchema,
    close: positiveDecimalSchema,
    volume: decimalSchema.refine((value) => Number(value) >= 0),
    revision: z.string().min(1).max(100),
  })
  .superRefine((c, ctx) => {
    if (![c.low, c.high, c.open, c.close].every((value) => value.length <= 60 && decimalPattern.test(value)))
      return;
    const low = scaled(c.low);
    const high = scaled(c.high);
    const open = scaled(c.open);
    const close = scaled(c.close);
    if (low > open || low > close || high < open || high < close || low > high) {
      ctx.addIssue({ code: 'custom', message: 'Invalid OHLC range' });
    }
  });
export type Candle = z.infer<typeof candleSchema>;
export const candleSlotSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('closed'), candle: candleSchema }),
  z.strictObject({ kind: z.literal('missing'), instrument: z.string(), openAt: instantSchema }),
  z.strictObject({ kind: z.literal('pending'), instrument: z.string(), openAt: instantSchema }),
]);
export type CandleSlot = z.infer<typeof candleSlotSchema>;

export const MAX_TRADE_USD = 10000;
/**
 * How a person trades. The model still forecasts every mandatory horizon; the mode picks the one the person is
 * shown, offered a trade on and scored by.
 */
export const TRADING_MODES = ['scalper', 'daytrader'] as const;
export const tradingModeSchema = z.enum(TRADING_MODES);
export type TradingMode = z.infer<typeof tradingModeSchema>;
export const MODE_HORIZON = { scalper: 5, daytrader: 30 } as const satisfies Record<TradingMode, Horizon>;
export const preferencesSchema = z.strictObject({
  markets: z.array(z.string().min(1).max(100)).max(40),
  mode: tradingModeSchema.default('daytrader'),
  autoAnalysis: z.boolean(),
  analysisLimit: z.number().int().min(1).max(200).default(10),
  ideaLimit: z.number().int().min(1).max(50).default(10),
  maxTradeUsd: positiveDecimalSchema.refine(
    (v) => !decimalPattern.test(v) || v.length > 60 || scaled(v) <= scaled(String(MAX_TRADE_USD)),
  ),
  style: z.string().max(1000),
  alerts: z.boolean(),
  actionableOnly: z.boolean().default(true),
  quiet: z
    .strictObject({
      enabled: z.boolean(),
      from: z.number().int().min(0).max(23),
      to: z.number().int().min(0).max(23),
      timezone: z.string().max(100),
    })
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value.timezone });
        return true;
      } catch {
        return false;
      }
    }, 'Unknown timezone'),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const messageTextSchema = z.string().trim().min(1).max(8000);

export const versionInputSchema = z.strictObject({
  baseVersionId: idSchema,
  prompt: z.string().trim().min(10).max(12000),
  model: z.string().min(1).max(100),
  note: z.string().max(400),
  requestId: idSchema,
});

/** The value at a path of own JSON fields; prototype properties are never evidence. */
export function valueAt(value: unknown, path: string): { found: boolean; value: unknown } {
  const segments = path
    .replace(/^\$\.?/, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.');
  let cursor: unknown = value;
  for (const segment of segments) {
    if (!segment || ['__proto__', 'constructor', 'prototype'].includes(segment))
      return { found: false, value: null };
    if (cursor === null || typeof cursor !== 'object' || !Object.hasOwn(cursor, segment))
      return { found: false, value: null };
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return { found: true, value: cursor };
}
export const hasEvidencePath = (value: unknown, path: string): boolean => valueAt(value, path).found;
/** A finite number at a path, written as a number or as a decimal string. */
export function numberAt(value: unknown, path: string): number | null {
  const at = valueAt(value, path).value;
  const n =
    typeof at === 'number' ? at : typeof at === 'string' && at.trim() !== '' ? Number(at) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

export function validateForecast(
  raw: unknown,
  expected: {
    dispatchId: string;
    brokerVersionId: string;
    snapshotId: string;
    inputHash: string;
    market: unknown;
  },
): { kind: 'accepted'; value: ForecastSubmission } | { kind: 'rejected'; errors: string[] } {
  const parsed = forecastSchema.safeParse(raw);
  if (!parsed.success)
    return {
      kind: 'rejected',
      errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  const value = parsed.data;
  const errors: string[] = [];
  for (const key of ['dispatchId', 'brokerVersionId', 'snapshotId', 'inputHash'] as const) {
    if (value[key] !== expected[key]) errors.push(`${key}: does not match dispatch`);
  }
  value.rationale.points.forEach((point, n) => {
    const show = point.show;
    if ((show.kind === 'ratio' || show.kind === 'number') && numberAt(expected.market, show.path) === null)
      errors.push(`points.${n}.show.path: not a number in the snapshot: ${show.path}`);
    if (
      show.kind === 'scale' &&
      !hasEvidencePath(expected.market, `technical_indicators.${show.indicator}.current`)
    )
      errors.push(`points.${n}.show.indicator: not in the snapshot: ${show.indicator}`);
    if (
      (show.kind === 'breadth' || show.kind === 'compare') &&
      numberAt(expected.market, `engineered_features.market_relative.breadth_up_${show.minutes}m`) === null
    )
      errors.push(`points.${n}.show: no other markets in the snapshot`);
  });
  return errors.length ? { kind: 'rejected', errors } : { kind: 'accepted', value };
}
