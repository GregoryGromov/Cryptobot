import { type Candle, candleSchema, instantSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { CHART_FRAMES, type ChartFrame } from '../kernel/frames.js';
import { D } from '../kernel/money.js';
import { MINUTE } from '../kernel/time.js';
import { boundedText } from '../platform/http.js';
import { canonical, sha256 } from '../platform/identity.js';

// Contract: reinforce-atp-signal@aabf3c9, docs/api-market-state.md, api-events.md, api-candles.md.
// Unknown feature fields remain in the model's input; only fields consumed here are interpreted.
const record = z.record(z.string(), z.unknown());
const instrumentId = z
  .string()
  .regex(/^HL:PERP:[^\s/?#]+$/)
  .max(108);
const snapshotId = z.string().regex(/^(?:mss|ms)-[a-f0-9]{64}$/);
const minute = instantSchema.refine((v) => v % MINUTE === 0);
const feed = z.enum(['READY', 'RECOVERING', 'NOT_LIVE']);
const universe = {
  verdict: z.enum(['ELIGIBLE', 'INELIGIBLE_PROVEN', 'UNVERIFIABLE']).nullable(),
  in_universe: z.boolean(),
  eligible: z.boolean(),
};
const candleColumns = z.tuple([
  z.literal('open_ts'),
  z.literal('close_ts'),
  z.literal('open'),
  z.literal('high'),
  z.literal('low'),
  z.literal('close'),
  z.literal('base_volume'),
  z.literal('trade_count'),
]);
const candleRow = z.tuple([
  minute,
  minute,
  z.number().positive(),
  z.number().positive(),
  z.number().positive(),
  z.number().positive(),
  z.number().nonnegative(),
  z.number().int().nonnegative(),
]);
export const atpStateSchema = z.looseObject({
  schema_version: z.literal('1.0'),
  market_state_id: snapshotId,
  event_id: z.string().min(1).nullable(),
  event_time_ms: minute,
  instrument: z.looseObject({ instrument_id: instrumentId }),
  source_versions: record,
  data_quality: z.looseObject({ valid: z.boolean(), raw_output_available: z.number().int().min(0).max(120) }),
  raw_candles: z.object({ columns: candleColumns, rows: z.array(candleRow).max(120) }),
  technical_indicators: record,
  engineered_features: record,
});
const currentSchema = z.looseObject({
  kind: z.literal('ON_DEMAND'),
  status: z.enum(['OK', 'STALE', 'INSUFFICIENT_HISTORY', 'UNAVAILABLE']),
  reasons: z.array(z.string().min(1).max(100)).max(50),
  instrument_id: instrumentId,
  market_state_id: snapshotId.nullable(),
  data_time_ms: minute.nullable(),
  computed_at_ms: instantSchema,
  responded_at_ms: instantSchema,
  freshness: z.looseObject({
    historical: z.boolean(),
    latest_bar_end_ms: minute.nullable(),
    stale: z.boolean(),
    feed,
  }),
  universe: z.object(universe),
  state: atpStateSchema.nullable(),
});
const storedSchema = z.object({
  kind: z.enum(['ON_DEMAND', 'EVENT']),
  market_state_id: snapshotId,
  instrument_id: instrumentId,
  data_time_ms: minute,
  event_id: z.string().min(1).nullable(),
  state: atpStateSchema,
});
const catalogSchema = z.object({
  phase: z.enum(['LOADING', 'CATCHUP', 'LIVE']),
  instruments: z
    .array(
      z.object({
        instrument_id: instrumentId,
        exchange_symbol: z.string().min(1).max(100),
        collector_table: z.boolean(),
        ...universe,
        feed,
      }),
    )
    .max(10000),
});

// MarketEvent, detector spec §19. Only the fields read below are interpreted; the rest is kept as received.
export const marketEventSchema = z.looseObject({
  schema_version: z.literal('1.0'),
  event_id: z.string().min(1).max(200),
  instrument: z.looseObject({ instrument_id: instrumentId }),
  event: z.looseObject({
    detected_at_ms: minute,
    direction: z.enum(['UP', 'DOWN']),
    primary_horizon_minutes: z.number().int().positive(),
    event_scope: z.enum(['IDIOSYNCRATIC', 'BROAD', 'MARKET_WIDE', 'UNKNOWN']),
    volume_confirmed: z.boolean(),
  }),
  horizons: z.record(
    z.string(),
    z.looseObject({
      simple_return: z.number().finite().nullable(),
      shock_multiple: z.number().finite().nullable(),
    }),
  ),
});
const cursorText = z.string().min(1).max(200);
const feedPageSchema = z.object({
  events: z
    .array(
      z.object({
        cursor: cursorText,
        event_id: z.string().min(1).max(200),
        market_state_id: snapshotId,
        instrument_id: instrumentId,
        detected_at_ms: minute,
        available_at_ms: instantSchema.nullable(),
        event: marketEventSchema,
        state: atpStateSchema,
      }),
    )
    .max(200),
  next_cursor: cursorText,
  has_more: z.boolean(),
  evaluated_through_ms: instantSchema.nullable(),
  floor: z.object({ cursor: cursorText, detected_at_ms: instantSchema.nullable() }),
  phase: z.enum(['LOADING', 'CATCHUP', 'LIVE']),
});
const candleReadSchema = z.object({
  instrument_id: instrumentId,
  status: z.enum(['OK', 'INCOMPLETE', 'UNAVAILABLE']),
  reasons: z.array(z.string().min(1).max(100)).max(50),
  requested: z.object({ from_ms: minute, to_ms: minute }),
  served: z.object({ from_ms: minute, to_ms: minute }).nullable(),
  read_at_ms: instantSchema,
  bars: z.number().int().min(0).max(1440),
  missing_minutes: z.number().int().min(0).max(1440),
  content_digest: z.string().min(1).max(200).nullable(),
  candles: z.object({ columns: candleColumns, rows: z.array(candleRow).max(1440) }),
});

const barsSchema = z.object({
  instrument_id: z.string(),
  frame: z.enum(CHART_FRAMES),
  bars: z
    .array(
      z.object({ t: z.number(), o: z.number(), h: z.number(), l: z.number(), c: z.number(), v: z.number() }),
    )
    .max(5000),
});

export type AtpState = z.infer<typeof atpStateSchema>;
export type AtpFeedPage = z.infer<typeof feedPageSchema>;
export type AtpCandles = Omit<z.infer<typeof candleReadSchema>, 'candles'> & { candles: Candle[] };
export type AtpCatalog = z.infer<typeof catalogSchema>;
export type AtpCurrent = z.infer<typeof currentSchema> & { rawResponse: string };
/** `cursor-lost`: the feed no longer serves the position (410): events behind its floor are gone upstream. */
export type AtpFailure = 'unauthorized' | 'not-found' | 'cursor-lost' | 'unavailable' | 'invalid-response';
export type AtpResult<T> = { kind: 'ok'; value: T } | { kind: 'failed'; reason: AtpFailure };
export interface AtpSignalPort {
  /** Long-polls up to `waitMs` when nothing follows the cursor; `null` reads from the feed's floor. */
  events(cursor: string | null, waitMs: number, signal?: AbortSignal): Promise<AtpResult<AtpFeedPage>>;
  /** Closed minutes opened in `[from, to)`, at most a day. */
  candles(instrument: string, from: number, to: number, signal?: AbortSignal): Promise<AtpResult<AtpCandles>>;
  /** The demo's candles of a frame from before its recorded minutes; the live service has no such read. */
  bars?(
    instrument: string,
    frame: ChartFrame,
    from: number,
    to: number,
    signal?: AbortSignal,
  ): Promise<AtpResult<z.infer<typeof barsSchema>['bars']>>;
  catalog(signal?: AbortSignal): Promise<AtpResult<AtpCatalog>>;
  current(instrument: string, signal?: AbortSignal): Promise<AtpResult<AtpCurrent>>;
  snapshot(id: string, signal?: AbortSignal): Promise<AtpResult<z.infer<typeof storedSchema>>>;
}

export function exchangeSymbol(instrument: string): string {
  return instrument.replace(/^HL:PERP:/, '');
}

function checkState(state: z.infer<typeof atpStateSchema>, id: string, instrument: string, cutoff: number) {
  if (
    state.market_state_id !== id ||
    state.instrument.instrument_id !== instrument ||
    state.event_time_ms !== cutoff
  )
    throw new Error('Snapshot identity mismatch');
  const rows = state.raw_candles.rows;
  if (
    rows.length !== state.data_quality.raw_output_available ||
    (state.data_quality.valid && rows.length !== 120)
  )
    throw new Error('Incomplete snapshot');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const prior = rows[i - 1];
    if (
      row[1] !== row[0] + MINUTE ||
      row[1] > cutoff ||
      (prior && row[0] <= prior[0]) ||
      (prior && state.data_quality.valid && row[0] !== prior[1])
    )
      throw new Error('Invalid snapshot candle chronology');
  }
  if (rows.length && rows.at(-1)![1] !== cutoff) throw new Error('Snapshot cutoff mismatch');
  snapshotCandles(state); // Validate OHLC, decimal representation and dimensions at the boundary.
}

/** A state's own candles: the same upstream rows as the range read, under the same content revisions. */
export function snapshotCandles(state: AtpState): Candle[] {
  return state.raw_candles.rows.map((row) => rowCandle(state.instrument.instrument_id, row));
}

/** Upstream candles change in place after late corrections and repairs: a revision names the content read. */
function rowCandle(instrument: string, row: z.infer<typeof candleRow>): Candle {
  const body = {
    instrument: exchangeSymbol(instrument),
    openAt: row[0],
    open: new D(row[2]).toFixed(),
    high: new D(row[3]).toFixed(),
    low: new D(row[4]).toFixed(),
    close: new D(row[5]).toFixed(),
    volume: new D(row[6]).toFixed(),
  };
  return candleSchema.parse({ ...body, revision: `atp:${sha256(canonical(body))}` });
}

function checkEvent(item: AtpFeedPage['events'][number]) {
  if (
    item.event.event_id !== item.event_id ||
    item.state.event_id !== item.event_id ||
    item.event.instrument.instrument_id !== item.instrument_id ||
    item.event.event.detected_at_ms !== item.detected_at_ms
  )
    throw new Error('Event identity mismatch');
  checkState(item.state, item.market_state_id, item.instrument_id, item.detected_at_ms);
}

function checkCandles(value: z.infer<typeof candleReadSchema>, instrument: string, from: number, to: number) {
  const { served, candles } = value;
  if (
    exchangeSymbol(value.instrument_id) !== exchangeSymbol(instrument) ||
    value.requested.from_ms !== from ||
    value.requested.to_ms !== to ||
    (served && (served.from_ms !== from || served.to_ms <= from || served.to_ms > to)) ||
    candles.rows.length !== value.bars ||
    (served
      ? value.bars + value.missing_minutes !== (served.to_ms - served.from_ms) / MINUTE
      : value.bars !== 0)
  )
    throw new Error('Unexpected candle range');
  for (const [i, row] of candles.rows.entries()) {
    const prior = candles.rows[i - 1];
    if (
      row[1] !== row[0] + MINUTE ||
      row[0] < from ||
      row[1] > served!.to_ms ||
      (prior && row[0] <= prior[0])
    )
      throw new Error('Invalid candle chronology');
  }
}

export function atpSignal(options: { url: string; token: string; fetch?: typeof fetch }): AtpSignalPort {
  const base = new URL(options.url);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error('Invalid atp-signal URL');
  base.pathname = `${base.pathname.replace(/\/$/, '')}/`;
  const fetcher = options.fetch ?? fetch;
  async function get<T>(
    path: string,
    parse: (value: unknown, raw: string) => T,
    signal?: AbortSignal,
    limits = { timeoutMs: 12000, maxBytes: 2_000_000 },
  ): Promise<AtpResult<T>> {
    let response: Response;
    try {
      response = await fetcher(new URL(path, base), {
        headers: { authorization: `Bearer ${options.token}`, accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.any([AbortSignal.timeout(limits.timeoutMs), ...(signal ? [signal] : [])]),
      });
    } catch {
      return { kind: 'failed', reason: 'unavailable' };
    }
    if (!response.ok) {
      await response.body?.cancel();
      return {
        kind: 'failed',
        reason:
          response.status === 401 || response.status === 403
            ? 'unauthorized'
            : response.status === 404
              ? 'not-found'
              : response.status === 410
                ? 'cursor-lost'
                : 'unavailable',
      };
    }
    try {
      const raw = await boundedText(response, limits.maxBytes);
      return { kind: 'ok', value: parse(JSON.parse(raw), raw) };
    } catch {
      return { kind: 'failed', reason: 'invalid-response' };
    }
  }
  return {
    events: (cursor, waitMs, signal) =>
      get(
        `v1/events?${new URLSearchParams({ ...(cursor ? { cursor } : {}), limit: '50', wait_ms: String(waitMs) })}`,
        (input) => {
          const value = feedPageSchema.parse(input);
          for (const item of value.events) checkEvent(item);
          return value;
        },
        signal,
        // A page grows to 8 MiB plus one element of at most 1 MiB; a long poll holds the request open.
        { timeoutMs: waitMs + 12000, maxBytes: 10_000_000 },
      ),
    candles: (instrument, from, to, signal) =>
      get(
        `v1/candles?${new URLSearchParams({ instrument, from: String(from), to: String(to) })}`,
        (input) => {
          const value = candleReadSchema.parse(input);
          checkCandles(value, instrument, from, to);
          return { ...value, candles: value.candles.rows.map((row) => rowCandle(value.instrument_id, row)) };
        },
        signal,
      ),
    bars: (instrument, frame, from, to, signal) =>
      get(
        `v1/bars?${new URLSearchParams({ instrument, frame, from: String(from), to: String(to) })}`,
        (input) => barsSchema.parse(input).bars,
        signal,
      ),
    catalog: (signal) =>
      get(
        'v1/instruments',
        (input) => {
          const value = catalogSchema.parse(input);
          const ids = new Set<string>();
          for (const row of value.instruments) {
            if (row.instrument_id !== `HL:PERP:${row.exchange_symbol}` || ids.has(row.instrument_id))
              throw new Error('Invalid catalog identity');
            ids.add(row.instrument_id);
          }
          return value;
        },
        signal,
      ),
    current: (instrument, signal) =>
      get(
        `v1/market-state?${new URLSearchParams({ instrument })}`,
        (input, rawResponse) => {
          const value = currentSchema.parse(input);
          if (
            exchangeSymbol(value.instrument_id) !== exchangeSymbol(instrument) ||
            value.freshness.historical ||
            value.freshness.latest_bar_end_ms !== value.data_time_ms
          )
            throw new Error('Unexpected current instrument or time');
          if (value.status === 'UNAVAILABLE') {
            if (value.state !== null || value.market_state_id !== null || value.data_time_ms !== null)
              throw new Error('Unavailable state must be empty');
          } else {
            if (
              !value.state ||
              !value.market_state_id ||
              value.data_time_ms === null ||
              value.state.event_id !== null
            )
              throw new Error('Missing current state');
            checkState(value.state, value.market_state_id, value.instrument_id, value.data_time_ms);
            if (
              (value.status === 'OK' && (value.freshness.stale || !value.state.data_quality.valid)) ||
              (value.status === 'STALE' && !value.freshness.stale) ||
              (value.status === 'INSUFFICIENT_HISTORY' && value.state.data_quality.valid)
            )
              throw new Error('Inconsistent quality');
          }
          return { ...value, rawResponse };
        },
        signal,
      ),
    snapshot: (id, signal) => {
      if (!snapshotId.safeParse(id).success)
        return Promise.resolve({ kind: 'failed', reason: 'invalid-response' });
      return get(
        `v1/market-state/${encodeURIComponent(id)}`,
        (input) => {
          const value = storedSchema.parse(input);
          if (
            value.market_state_id !== id ||
            value.event_id !== value.state.event_id ||
            (value.kind === 'ON_DEMAND') !== (value.event_id === null)
          )
            throw new Error('Unexpected stored snapshot');
          checkState(value.state, id, value.instrument_id, value.data_time_ms);
          return value;
        },
        signal,
      );
    },
  };
}
