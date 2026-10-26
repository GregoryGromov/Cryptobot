// Why the broker thinks so, drawn by the platform from what he picked. Each point
// names a kind of picture and where its data lies; every number on it is read
// off the frozen snapshot, never written by the model. The same snapshot, laid
// out whole, is what the person can look through under «Все данные».
import { type Exhibit, type Level, numberAt, type Point, valueAt } from '@reinforce/harness-contract';
import { intlLocale, type Locale, type Translate, translator } from '@reinforce/i18n/server';
import type { Forecast } from '../../modules/forecast/index.js';
import type { Snapshot } from '../../modules/market/index.js';

type Tone = 'up' | 'down' | 'flat';
/** A number on its own scale: where it is now, where it was 15 and 5 minutes ago, and its range over the hour. */
export type Scale = {
  min: number;
  max: number;
  zones: { from: number; to: number; tone: Tone }[];
  trail: { label: string; value: number }[];
  range: [number, number] | null;
  ends: [string, string] | null;
};
export type Figure =
  | {
      kind: 'price';
      startAt: number;
      closes: number[];
      volumes: number[] | null;
      usualVolume: number | null;
      volumeTimes: number | null;
      span: number | null;
      levels: { name: string; price: number }[];
    }
  | { kind: 'ratio'; value: number }
  | ({ kind: 'scale' } & Scale)
  | { kind: 'breadth'; up: number; flat: number; down: number; total: number | null }
  | { kind: 'compare'; rows: { label: string; coin: string | null; value: number; own: boolean }[] }
  | { kind: 'number'; text: string };
/** A point as the page shows it: his thought, the number the platform read for it, its picture and its row in the data. */
export type WhyPoint = Pick<Point, 'claim' | 'stance' | 'weight' | 'horizons'> & {
  value: string | null;
  caption: string;
  figure: Figure | null;
  row: string | null;
};
export type Why = { asOf: number; points: WhyPoint[] };

export type InputRow =
  | {
      kind: 'windows';
      id: string;
      label: string;
      hint: string;
      coin: string | null;
      tone: 'signed' | 'ratio' | 'share' | 'plain';
      cells: { label: string; value: number; text: string }[];
    }
  | { kind: 'scale'; id: string; label: string; hint: string; text: string; was: string | null; scale: Scale }
  | { kind: 'value'; id: string; label: string; hint: string; text: string };
export type InputGroup = { id: 'move' | 'volume' | 'market' | 'shape' | 'indicators'; rows: InputRow[] };
/** Everything the model was given about the market, as one person can read it. */
export type Inputs = {
  asOf: number;
  candles: { t: number; o: number; h: number; l: number; c: number; v: number }[];
  groups: InputGroup[];
  cited: string[];
  /** How many markets the snapshot compared this one with; null when it did not. */
  markets: number | null;
  quality: {
    bars: number;
    missing: number;
    valid: boolean;
    detector: string | null;
    features: string | null;
  };
};

type Minute = { at: number; open: number; close: number; high: number; low: number; volume: number };
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Only the frozen snapshot is read. No current candles or locally reconstructed indicators. */
function frozen(snapshot: Snapshot) {
  const root = snapshot.body;
  const body = valueAt(root, 'numeric_state').value ?? root;
  const packed = valueAt(body, 'raw_candles.rows').value;
  const candles = valueAt(body, 'candles').value;
  const rows: Minute[] = [];
  for (const raw of Array.isArray(packed) ? packed : Array.isArray(candles) ? candles : []) {
    const values = Array.isArray(raw)
      ? [raw[0], raw[2], raw[5], raw[3], raw[4], raw[6]]
      : ['openAt', 'open', 'close', 'high', 'low', 'volume'].map((k) => valueAt(raw, k).value);
    const [time, open, close, high, low, volume] = values.map((x) =>
      finite(x) ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : null,
    );
    if (
      !finite(time) ||
      !finite(open) ||
      !finite(close) ||
      !finite(high) ||
      !finite(low) ||
      !finite(volume) ||
      close <= 0 ||
      low <= 0 ||
      high < close ||
      low > close ||
      volume < 0 ||
      time + 60000 > snapshot.cutoffAt
    )
      continue;
    rows.push({ at: time, open, close, high, low, volume });
  }
  rows.sort((a, b) => a.at - b.at);
  // Graphs have one point per minute. Keep only a contiguous suffix, never hide a gap by joining it.
  let start = rows.length - 1;
  while (start > 0 && rows[start]!.at - rows[start - 1]!.at === 60000) start--;
  const continuous = rows.slice(Math.max(0, start));
  return { body, rows: continuous.at(-1)?.at === snapshot.cutoffAt - 60000 ? continuous : [] };
}

/** Numbers written the way the words around them are. */
const numbers = (locale: Locale) => {
  const n = (x: number, digits = 2) =>
    x.toLocaleString(intlLocale(locale), { maximumFractionDigits: digits });
  const signed = (x: number, digits = 2, unit = '%') =>
    `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toLocaleString(intlLocale(locale), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}${unit}`;
  const usd = (x: number) =>
    `$${x.toLocaleString(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: x >= 100 ? 2 : 4 })}`;
  const compact = (x: number) =>
    `$${x.toLocaleString(intlLocale(locale), { notation: 'compact', maximumFractionDigits: 1 })}`;
  return { n, signed, usd, compact };
};

/** The prices a level names, read off the snapshot; a level the snapshot cannot give is absent. */
export function levelPrices(snapshot: Snapshot): Partial<Record<Level, number>> {
  const { body, rows } = frozen(snapshot);
  const close = rows.at(-1)?.close;
  const out: Partial<Record<Level, number>> = {};
  const vwap = numberAt(body, 'technical_indicators.vwap.current.vwap_proxy');
  if (vwap !== null && vwap > 0) out.vwap = vwap;
  const toMid = numberAt(body, 'technical_indicators.bollinger.current.distance_to_mid_bps');
  const width = numberAt(body, 'technical_indicators.bollinger.current.bandwidth');
  if (close && toMid !== null && width !== null && width >= 0) {
    const middle = close / (1 + toMid / 10000);
    out.bollinger_middle = middle;
    out.bollinger_upper = middle * (1 + width / 2);
    out.bollinger_lower = middle * (1 - width / 2);
  }
  if (rows.length) {
    out.high_120m = Math.max(...rows.map((r) => r.high));
    out.low_120m = Math.min(...rows.map((r) => r.low));
  }
  return out;
}

const WINDOWS = ['5m', '15m', '30m'] as const;
type RowWords = { label: string; hint: string; short?: string; what?: string };
/** The words of a locale the pictures and rows are labelled with, looked up by the names the snapshot uses. */
type Words = {
  rows: Record<string, RowWords>;
  windows: Record<string, string>;
  ends: Record<string, { low: string; high: string }>;
  levels: Record<string, string>;
  scope: Record<string, string>;
};
type Ctx = {
  t: Translate;
  w: Words;
  num: ReturnType<typeof numbers>;
  body: unknown;
  rows: Minute[];
  coin: string;
};
const words = (t: Translate): Words => ({
  rows: t('inputs.rows', { returnObjects: true }),
  windows: t('inputs.windows', { returnObjects: true }),
  ends: t('inputs.ends', { returnObjects: true }),
  levels: t('explain.levels', { returnObjects: true }),
  scope: t('inputs.scope', { returnObjects: true }),
});
const row = (c: Ctx, id: string): RowWords => c.w.rows[id] ?? { label: id, hint: '' };

/** An indicator as a scale, if the snapshot has it: its value now, 5 and 15 minutes ago, and its hour's range. */
function indicatorScale(c: Ctx, id: string): { scale: Scale; now: number; text: string; was: string } | null {
  const spec = SCALE_SPECS[id];
  if (!spec) return null;
  const base = `technical_indicators.${spec.indicator}`;
  if (valueAt(c.body, `${base}.valid`).value === false) return null;
  const now = numberAt(c.body, `${base}.current.${spec.field}`);
  if (now === null) return null;
  const ago15 = numberAt(c.body, `${base}.lookback_values.15m_ago.${spec.field}`);
  const ago5 = numberAt(c.body, `${base}.lookback_values.5m_ago.${spec.field}`);
  const lo = numberAt(c.body, `${base}.recent_range.min.${spec.field}`);
  const hi = numberAt(c.body, `${base}.recent_range.max.${spec.field}`);
  const scaled = (x: number) => x * spec.factor;
  const seen = [now, ago5, ago15, lo, hi].filter((x): x is number => x !== null).map(scaled);
  const reach = Math.max(...seen.map(Math.abs));
  const [min, max] = spec.bounds ?? [-reach * 1.15 || -1, reach * 1.15 || 1];
  const trail = [
    ...(ago15 !== null ? [{ label: c.t('explain.ago15'), value: scaled(ago15) }] : []),
    ...(ago5 !== null ? [{ label: c.t('explain.ago5'), value: scaled(ago5) }] : []),
    { label: c.t('explain.atForecast'), value: scaled(now) },
  ];
  const fmt = (x: number) => (spec.unit === '%' ? c.num.signed(x, 2) : c.num.n(x, spec.digits));
  return {
    scale: {
      min: Math.min(min, ...seen),
      max: Math.max(max, ...seen),
      zones: spec.zones,
      trail,
      range: lo !== null && hi !== null ? [scaled(lo), scaled(hi)] : null,
      ends: spec.ends && c.w.ends[spec.ends] ? [c.w.ends[spec.ends]!.low, c.w.ends[spec.ends]!.high] : null,
    },
    now: scaled(now),
    text: fmt(scaled(now)),
    was:
      trail.length > 1
        ? trail
            .slice(0, -1)
            .map((p) => fmt(p.value))
            .join(' → ')
        : '',
  };
}
const SCALE_SPECS: Record<
  string,
  {
    indicator: string;
    field: string;
    factor: number;
    digits: number;
    unit?: '%';
    bounds?: [number, number];
    zones: Scale['zones'];
    ends?: string;
  }
> = {
  rsi: {
    indicator: 'rsi',
    field: 'rsi',
    factor: 1,
    digits: 0,
    bounds: [0, 100],
    zones: [
      { from: 0, to: 30, tone: 'down' },
      { from: 70, to: 100, tone: 'up' },
    ],
    ends: 'force',
  },
  stochastic: {
    indicator: 'stochastic',
    field: 'fast_k',
    factor: 1,
    digits: 0,
    bounds: [0, 100],
    zones: [
      { from: 0, to: 20, tone: 'down' },
      { from: 80, to: 100, tone: 'up' },
    ],
    ends: 'span',
  },
  mfi: {
    indicator: 'mfi',
    field: 'mfi',
    factor: 1,
    digits: 0,
    bounds: [0, 100],
    zones: [
      { from: 0, to: 20, tone: 'down' },
      { from: 80, to: 100, tone: 'up' },
    ],
    ends: 'force',
  },
  adx: {
    indicator: 'adx',
    field: 'adx',
    factor: 1,
    digits: 0,
    bounds: [0, 60],
    zones: [{ from: 25, to: 60, tone: 'flat' }],
    ends: 'trend',
  },
  bollinger: {
    indicator: 'bollinger',
    field: 'percent_b',
    factor: 1,
    digits: 2,
    bounds: [-0.25, 1.25],
    zones: [
      { from: -0.25, to: 0, tone: 'down' },
      { from: 1, to: 1.25, tone: 'up' },
    ],
    ends: 'band',
  },
  donchian: {
    indicator: 'donchian',
    field: 'position',
    factor: 1,
    digits: 2,
    bounds: [0, 1],
    zones: [],
    ends: 'channel',
  },
  macd: { indicator: 'macd', field: 'histogram_bps', factor: 0.01, digits: 3, unit: '%', zones: [] },
  vwap: {
    indicator: 'vwap',
    field: 'vwap_proxy_distance_bps',
    factor: 0.01,
    digits: 2,
    unit: '%',
    zones: [],
  },
  obv: {
    indicator: 'obv',
    field: 'obv_pressure',
    factor: 1,
    digits: 2,
    bounds: [-1, 1],
    zones: [],
    ends: 'pressure',
  },
};

/** A row of the same number over several windows, each written and drawn the same way. */
function windows(
  c: Ctx,
  id: string,
  tone: 'signed' | 'ratio' | 'share' | 'plain',
  cells: [string, string][],
  coin: string | null = null,
): InputRow | null {
  const out = cells.flatMap(([label, path]) => {
    const raw = numberAt(c.body, path);
    if (raw === null) return [];
    const value = tone === 'signed' || tone === 'share' ? raw * 100 : raw;
    const text =
      tone === 'signed'
        ? c.num.signed(value)
        : tone === 'ratio'
          ? `×${c.num.n(value, 1)}`
          : tone === 'share'
            ? `${c.num.n(value, 0)}%`
            : c.num.n(value, 2);
    return [{ label: c.w.windows[label] ?? label, value, text }];
  });
  return out.length
    ? { kind: 'windows', id, tone, coin, label: row(c, id).label, hint: row(c, id).hint, cells: out }
    : null;
}
function value(c: Ctx, id: string, text: string | null): InputRow | null {
  return text === null ? null : { kind: 'value', id, label: row(c, id).label, hint: row(c, id).hint, text };
}
function scaleRow(c: Ctx, id: string): InputRow | null {
  const s = indicatorScale(c, id);
  return s
    ? {
        kind: 'scale',
        id,
        label: row(c, id).label,
        hint: row(c, id).hint,
        text: s.text,
        was: s.was || null,
        scale: s.scale,
      }
    : null;
}
/** The same field over the windows the snapshot keeps it for. */
const wins = (base: string) => WINDOWS.map((w) => [w, `${base}_${w}`] as [string, string]);

function groups(c: Ctx): InputGroup[] {
  const ef = 'engineered_features';
  const shock = `${ef}.event_shock`;
  const activity = `${ef}.activity_anomaly`;
  const relative = `${ef}.market_relative`;
  const path = `${ef}.price_path_structure`;
  const vol = `${ef}.volatility_regime`;
  const bps = (p: string) => {
    const x = numberAt(c.body, p);
    return x === null ? null : c.num.signed(x / 100);
  };
  const share = (p: string) => {
    const x = numberAt(c.body, p);
    return x === null ? null : `${c.num.n(x * 100, 0)}%`;
  };
  const yesNo = (p: string) => {
    const x = valueAt(c.body, p).value;
    return typeof x === 'boolean' ? c.t(x ? 'inputs.yes' : 'inputs.no') : null;
  };
  const eligible = numberAt(c.body, `${relative}.eligible_instrument_count`);
  const scope = valueAt(c.body, `${relative}.event_scope`).value;
  const diPlus = numberAt(c.body, 'technical_indicators.adx.current.di_plus');
  const diMinus = numberAt(c.body, 'technical_indicators.adx.current.di_minus');
  const natr = numberAt(c.body, 'technical_indicators.atr.current.natr_percent');
  const width = numberAt(c.body, 'technical_indicators.bollinger.current.bandwidth');
  const upper = numberAt(c.body, `${path}.mean_upper_wick_fraction_15m`);
  const lower = numberAt(c.body, `${path}.mean_lower_wick_fraction_15m`);
  const keep = (rows: (InputRow | null)[]) => rows.filter((r): r is InputRow => r !== null);
  return [
    {
      id: 'move',
      rows: keep([
        windows(c, 'returns', 'signed', [
          ['1m', `${shock}.simple_return_1m`],
          ['5m', `${shock}.simple_return_5m`],
          ['15m', `${shock}.simple_return_15m`],
          ['30m', `${shock}.simple_return_30m`],
          ['60m', `${shock}.simple_return_60m`],
        ]),
        windows(c, 'shock', 'ratio', wins(`${shock}.shock_multiple`)),
        windows(c, 'rarity', 'share', wins(`${shock}.absolute_move_percentile`)),
        windows(c, 'z', 'plain', wins(`${shock}.detector_robust_z`)),
        value(c, 'fresh', share(`${shock}.recent_fraction`)),
        value(c, 'consistent', yesNo(`${shock}.direction_consistent`)),
      ]),
    },
    {
      id: 'volume',
      rows: keep([
        windows(c, 'volume', 'ratio', [
          ...wins(`${activity}.volume_vs_7d_median`),
          ['60m', `${activity}.volume_vs_7d_median_60m`],
        ]),
        windows(c, 'volumeRank', 'share', wins(`${activity}.volume_percentile`)),
        windows(c, 'trades', 'share', wins(`${activity}.trade_count_percentile`)),
        value(
          c,
          'notional',
          numberAt(c.body, `${activity}.notional_volume_5m`) === null
            ? null
            : c.num.compact(numberAt(c.body, `${activity}.notional_volume_5m`)!),
        ),
        scaleRow(c, 'obv'),
      ]),
    },
    {
      id: 'market',
      rows: keep([
        windows(c, 'breadthUp', 'share', wins(`${relative}.breadth_up`)),
        windows(c, 'breadthDown', 'share', wins(`${relative}.breadth_down`)),
        windows(
          c,
          'btc',
          'signed',
          WINDOWS.map((w) => [w, `${relative}.btc_returns.${w}`] as [string, string]),
          'BTC',
        ),
        windows(
          c,
          'eth',
          'signed',
          WINDOWS.map((w) => [w, `${relative}.eth_returns.${w}`] as [string, string]),
          'ETH',
        ),
        windows(c, 'median', 'signed', wins(`${relative}.cross_sectional_median_return`)),
        windows(c, 'relative', 'signed', wins(`${relative}.relative_return`), c.coin),
        value(
          c,
          'scope',
          typeof scope === 'string'
            ? `${c.w.scope[scope] ?? scope}${eligible !== null ? ` · ${c.t('inputs.markets', { count: eligible })}` : ''}`
            : null,
        ),
      ]),
    },
    {
      id: 'shape',
      rows: keep([
        value(
          c,
          'rv',
          numberAt(c.body, `${vol}.rv_regime_ratio_30m`) === null
            ? null
            : `×${c.num.n(numberAt(c.body, `${vol}.rv_regime_ratio_30m`)!, 1)}`,
        ),
        value(c, 'natr', natr === null ? null : `${c.num.n(natr, 2)}%`),
        windows(c, 'range', 'plain', [
          ['30m', `${vol}.range_30m_percent`],
          ['120m', `${vol}.range_120m_percent`],
        ]),
        (() => {
          const x = numberAt(c.body, `${path}.range_position_120m`);
          return x === null
            ? null
            : ({
                kind: 'scale',
                id: 'position',
                label: row(c, 'position').label,
                hint: row(c, 'position').hint,
                text: c.num.n(x, 2),
                was: null,
                scale: {
                  min: 0,
                  max: 1,
                  zones: [],
                  trail: [{ label: c.t('explain.atForecast'), value: x }],
                  range: null,
                  ends: c.w.ends.channel ? [c.w.ends.channel.low, c.w.ends.channel.high] : null,
                },
              } satisfies InputRow);
        })(),
        value(c, 'toHigh', bps(`${path}.distance_from_120m_high_bps`)),
        value(c, 'toLow', bps(`${path}.distance_from_120m_low_bps`)),
        windows(c, 'efficiency', 'share', [
          ['primary', `${path}.directional_efficiency_primary`],
          ['30m', `${path}.directional_efficiency_30m`],
        ]),
        windows(c, 'flips', 'plain', [
          ['30m', `${path}.direction_changes_30m`],
          ['60m', `${path}.direction_changes_60m`],
        ]),
        value(
          c,
          'wicks',
          upper !== null && lower !== null
            ? `${c.num.n(upper * 100, 0)}% · ${c.num.n(lower * 100, 0)}%`
            : null,
        ),
      ]),
    },
    {
      id: 'indicators',
      rows: keep([
        scaleRow(c, 'rsi'),
        scaleRow(c, 'stochastic'),
        scaleRow(c, 'mfi'),
        scaleRow(c, 'bollinger'),
        value(c, 'bandwidth', width === null ? null : `${c.num.n(width * 100, 2)}%`),
        scaleRow(c, 'macd'),
        scaleRow(c, 'adx'),
        value(
          c,
          'di',
          diPlus !== null && diMinus !== null
            ? c.t('inputs.versus', { a: c.num.n(diPlus, 0), b: c.num.n(diMinus, 0) })
            : null,
        ),
        scaleRow(c, 'vwap'),
        scaleRow(c, 'donchian'),
      ]),
    },
  ];
}

/** Where a point's picture lies in all the data, so the page can lead to it and mark it as cited. */
function rowOf(show: Exhibit): string | null {
  if (show.kind === 'scale') return show.indicator;
  if (show.kind === 'breadth') return 'breadthUp';
  if (show.kind === 'compare') return 'relative';
  if (show.kind === 'price') return show.volume ? 'volume' : 'returns';
  const p = show.path;
  if (/shock_multiple/.test(p)) return 'shock';
  if (/volume_vs_7d_median/.test(p)) return 'volume';
  if (/rv_regime_ratio/.test(p)) return 'rv';
  if (/trade_count/.test(p)) return 'trades';
  if (/absolute_move_percentile/.test(p)) return 'rarity';
  if (/(simple_)?return_\d+m$/.test(p)) return 'returns';
  if (/breadth/.test(p)) return 'breadthUp';
  const indicator = /^technical_indicators\.(\w+)\./.exec(p)?.[1];
  return indicator && indicator in SCALE_SPECS ? indicator : null;
}

function exhibit(c: Ctx, show: Exhibit, levels: Partial<Record<Level, number>>, cutoffAt: number) {
  const { t, num, rows } = c;
  if (show.kind === 'price') {
    const seen = rows.slice(-show.minutes - 1);
    if (seen.length < 3) return null;
    const first = seen[0]!.close;
    const last = seen.at(-1)!.close;
    const times = numberAt(c.body, 'engineered_features.activity_anomaly.volume_vs_7d_median_5m');
    const recent = rows.slice(-5).reduce((sum, r) => sum + r.volume, 0) / 5;
    const usual = times && times > 0 ? recent / times : null;
    const marked = show.span ? rows.at(-1 - show.span)?.close : undefined;
    return {
      figure: {
        kind: 'price',
        startAt: seen[0]!.at,
        closes: seen.map((r) => r.close),
        volumes: show.volume ? seen.map((r) => r.volume) : null,
        usualVolume: show.volume ? usual : null,
        volumeTimes: show.volume ? times : null,
        span: show.span,
        levels: show.levels.flatMap((l) =>
          levels[l] === undefined ? [] : [{ name: c.w.levels[l] ?? l, price: levels[l]! }],
        ),
      } satisfies Figure,
      // A point about levels is read off the picture; a volume ratio beside it would answer something else.
      value: show.levels.length
        ? null
        : show.volume && times !== null
          ? `×${num.n(times, 1)}`
          : num.signed((last / (marked ?? first) - 1) * 100),
      caption: t(
        show.levels.length && show.volume
          ? 'explain.caption.levelsVolume'
          : show.levels.length
            ? 'explain.caption.levels'
            : show.volume
              ? 'explain.caption.volume'
              : 'explain.caption.price',
        { minutes: show.minutes },
      ),
    };
  }
  if (show.kind === 'ratio') {
    const v = numberAt(c.body, show.path);
    if (v === null) return null;
    return {
      figure: { kind: 'ratio', value: v } satisfies Figure,
      value: `×${num.n(v, 1)}`,
      caption: t('explain.caption.ratio'),
    };
  }
  if (show.kind === 'scale') {
    const s = indicatorScale(c, show.indicator);
    if (!s) return null;
    return {
      figure: { kind: 'scale', ...s.scale } satisfies Figure,
      value: `${row(c, show.indicator).short ?? show.indicator} ${s.text}`,
      caption: row(c, show.indicator).what ?? '',
    };
  }
  const rel = 'engineered_features.market_relative';
  if (show.kind === 'breadth') {
    const up = numberAt(c.body, `${rel}.breadth_up_${show.minutes}m`);
    const down = numberAt(c.body, `${rel}.breadth_down_${show.minutes}m`);
    if (up === null || down === null) return null;
    const total = numberAt(c.body, `${rel}.eligible_instrument_count`);
    return {
      figure: { kind: 'breadth', up, down, flat: Math.max(0, 1 - up - down), total } satisfies Figure,
      value: total ? t('explain.ofMarkets', { n: Math.round(up * total), total }) : `${num.n(up * 100, 0)}%`,
      caption: t('explain.caption.breadth', { minutes: show.minutes }),
    };
  }
  if (show.kind === 'compare') {
    const w = `${show.minutes}m`;
    const own = numberAt(c.body, `engineered_features.event_shock.simple_return_${w}`);
    const rowsOut = [
      { label: c.coin, coin: c.coin, path: `engineered_features.event_shock.simple_return_${w}`, own: true },
      { label: 'BTC', coin: 'BTC', path: `${rel}.btc_returns.${w}`, own: false },
      { label: 'ETH', coin: 'ETH', path: `${rel}.eth_returns.${w}`, own: false },
      {
        label: t('explain.median'),
        coin: null,
        path: `${rel}.cross_sectional_median_return_${w}`,
        own: false,
      },
    ].flatMap((r) => {
      const v = numberAt(c.body, r.path);
      return v === null ? [] : [{ label: r.label, coin: r.coin, value: v * 100, own: r.own }];
    });
    if (rowsOut.length < 2) return null;
    return {
      figure: { kind: 'compare', rows: rowsOut } satisfies Figure,
      value: own === null ? null : num.signed(own * 100),
      caption: t('explain.caption.compare', { minutes: show.minutes }),
    };
  }
  const v = numberAt(c.body, show.path);
  if (v === null) return null;
  return {
    figure: { kind: 'number', text: num.n(v, 4) } satisfies Figure,
    value: num.n(v, 2),
    caption: t('explain.caption.number', { at: new Date(cutoffAt).toISOString().slice(11, 16) }),
  };
}

const context = (snapshot: Snapshot, locale: Locale): Ctx => {
  const { body, rows } = frozen(snapshot);
  const t = translator(locale);
  return { t, w: words(t), num: numbers(locale), body, rows, coin: snapshot.instrument };
};

export function whyView(value: Forecast, snapshot: Snapshot, locale: Locale): Why {
  const c = context(snapshot, locale);
  const levels = levelPrices(snapshot);
  return {
    asOf: snapshot.cutoffAt,
    points: value.body.rationale.points.map((p) => {
      const shown = exhibit(c, p.show, levels, snapshot.cutoffAt);
      return {
        claim: p.claim,
        stance: p.stance,
        weight: p.weight,
        horizons: p.horizons,
        value: shown?.value ?? null,
        caption: shown?.caption ?? c.t('explain.caption.missing'),
        figure: shown?.figure ?? null,
        row: rowOf(p.show),
      };
    }),
  };
}

export function inputsView(value: Forecast, snapshot: Snapshot, locale: Locale): Inputs {
  const c = context(snapshot, locale);
  const all = groups(c);
  const ids = new Set(all.flatMap((g) => g.rows.map((r) => r.id)));
  return {
    asOf: snapshot.cutoffAt,
    candles: c.rows.map((r) => ({ t: r.at, o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume })),
    groups: all.filter((g) => g.rows.length),
    cited: [...new Set(value.body.rationale.points.flatMap((p) => rowOf(p.show) ?? []))].filter((id) =>
      ids.has(id),
    ),
    markets: numberAt(c.body, 'engineered_features.market_relative.eligible_instrument_count'),
    quality: {
      bars: c.rows.length,
      missing: numberAt(c.body, 'data_quality.missing_bars') ?? 0,
      valid: snapshot.quality === 'valid',
      detector:
        typeof valueAt(c.body, 'source_versions.detector_version').value === 'string'
          ? String(valueAt(c.body, 'source_versions.detector_version').value)
          : null,
      features:
        typeof valueAt(c.body, 'source_versions.feature_builder_version').value === 'string'
          ? String(valueAt(c.body, 'source_versions.feature_builder_version').value)
          : null,
    },
  };
}
