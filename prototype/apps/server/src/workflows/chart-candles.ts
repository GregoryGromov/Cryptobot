import type { Candle } from '@reinforce/harness-contract';
import type { ExchangeBar } from '../adapters/hyperliquid.js';
import { CHART_BARS, CHART_FRAMES, type ChartFrame, FRAME_MS, frameFor } from '../kernel/frames.js';
import { MINUTE, minuteFloor } from '../kernel/time.js';
import * as market from '../modules/market/index.js';
import type { Deps } from './deps.js';

type Bar = ExchangeBar;

const barOf = (c: Candle): Bar => ({
  t: c.openAt,
  o: Number(c.open),
  h: Number(c.high),
  l: Number(c.low),
  c: Number(c.close),
  v: Number(c.volume),
});

export async function chart(deps: Deps, coin: string, from: number, to: number): Promise<Bar[]> {
  return (await market.loadCandles(deps.db, coin, from, Math.min(to, minuteFloor(deps.clock.now())))).map(
    ({ candle }) => barOf(candle),
  );
}
/** Candles of a frame built from minutes: a frame's candle opens at its own boundary and holds the minutes inside it. */
export function aggregate(minutes: readonly Bar[], frame: ChartFrame): Bar[] {
  const step = FRAME_MS[frame];
  const out: Bar[] = [];
  for (const m of minutes) {
    const t = Math.floor(m.t / step) * step;
    const last = out.at(-1);
    if (last?.t === t) {
      last.h = Math.max(last.h, m.h);
      last.l = Math.min(last.l, m.l);
      last.c = m.c;
      last.v += m.v;
    } else out.push({ ...m, t });
  }
  return out;
}

// Minutes read from our own store when the exchange is not asked: two weeks keeps a read under a few MB.
const STORED_SPAN = 14 * 1440 * MINUTE;
// The most the market source serves in one read.
const SOURCE_READ = 1440 * MINUTE;
const CACHE_MS = 20_000;
const readCache = new Map<string, { at: number; bars: Promise<Bar[] | null> }>();

function remembered(deps: Deps, key: string, read: () => Promise<Bar[] | null>) {
  const now = deps.clock.now();
  const hit = readCache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.bars;
  for (const [k, v] of readCache) if (now - v.at >= CACHE_MS) readCache.delete(k);
  const bars = read();
  readCache.set(key, { at: now, bars });
  return bars;
}

async function exchangeBars(deps: Deps, coin: string, frame: ChartFrame, from: number, to: number) {
  const exchange = deps.exchangeCandles;
  if (!exchange) return null;
  return remembered(deps, `exchange|${coin}|${frame}|${from}|${to}`, () =>
    exchange.bars(coin, frame, from, to),
  );
}

/** A replay's minutes before our store took any: read back from `to` a day at a time while the source has them. */
async function sourceMinutes(deps: Deps, coin: string, from: number, to: number): Promise<Bar[]> {
  const source = deps.marketSource;
  if (!source || deps.config.MARKET_MODE !== 'replay' || to - from < MINUTE) return [];
  const read = async () => {
    const days: Bar[][] = [];
    for (let end = to; end > from; end -= SOURCE_READ) {
      const day = await source.candles(coin, Math.max(from, end - SOURCE_READ), end, deps.shutdown);
      if (day.kind !== 'ok' || !day.value.candles.length) break;
      days.unshift(day.value.candles.map(barOf));
    }
    return days.flat();
  };
  return (await remembered(deps, `source|${coin}|${from}|${to}`, read)) ?? [];
}

const keepsPast = (deps: Deps) => deps.config.MARKET_MODE === 'replay' && Boolean(deps.marketSource?.bars);

/** A replay's candles of a frame from before its recorded minutes. */
async function pastBars(
  deps: Deps,
  coin: string,
  frame: ChartFrame,
  from: number,
  to: number,
): Promise<Bar[]> {
  const read = deps.marketSource?.bars;
  if (!read || !keepsPast(deps) || frame === '1m' || to <= from) return [];
  const bars = () =>
    read(coin, frame, from, to, deps.shutdown).then((result) => (result.kind === 'ok' ? result.value : null));
  return (await remembered(deps, `past|${coin}|${frame}|${from}|${to}`, bars)) ?? [];
}

/** Without the exchange: our minutes in `[from, to)`, a replay's source minutes before them and its past before those. */
async function ownBars(
  deps: Deps,
  coin: string,
  frame: ChartFrame,
  from: number,
  to: number,
): Promise<Bar[]> {
  const edge = Math.min(to, minuteFloor(deps.clock.now()));
  const since = Math.floor(Math.max(from, to - STORED_SPAN) / MINUTE) * MINUTE;
  const stored = await chart(deps, coin, since, to);
  const minutes = [...(await sourceMinutes(deps, coin, since, stored[0]?.t ?? edge)), ...stored];
  const candles = frame === '1m' ? minutes : aggregate(minutes, frame);
  return [...(await pastBars(deps, coin, frame, from, minutes[0]?.t ?? edge)), ...candles];
}

/** The chart of a market: its last `bars` candles of a frame, the one in progress last. */
export async function chartHistory(
  deps: Deps,
  coin: string,
  frame: ChartFrame,
  bars = CHART_BARS,
): Promise<Bar[]> {
  const step = FRAME_MS[frame];
  const end = Math.floor(deps.clock.now() / step) * step + step;
  const from = end - bars * step;
  const exchange = await exchangeBars(deps, coin, frame, Math.floor(from / MINUTE) * MINUTE, end);
  if (exchange?.length) return exchange;
  return ownBars(deps, coin, frame, from, end);
}

/** The candles of a span a person picked on the chart, in a frame coarse enough to stay short. */
export async function spanCandles(deps: Deps, coin: string, span: { from: number; to: number }, bars = 120) {
  const frame = frameFor(span.from, span.to, bars);
  const step = FRAME_MS[frame];
  const exchange = await exchangeBars(deps, coin, frame, Math.floor(span.from / step) * step, span.to);
  if (exchange?.length) return { frame, candles: exchange };
  if (keepsPast(deps)) {
    // The past is kept coarser the further back it lies: a span is read in the first frame that reaches its start.
    let read = { frame, candles: [] as Bar[] };
    for (const coarser of CHART_FRAMES.slice(CHART_FRAMES.indexOf(frame))) {
      read = { frame: coarser, candles: await ownBars(deps, coin, coarser, span.from, span.to) };
      if ((read.candles[0]?.t ?? Number.POSITIVE_INFINITY) < span.from + FRAME_MS[coarser]) break;
    }
    return read;
  }
  if (span.to - span.from > STORED_SPAN) return { frame, candles: [] };
  const minutes = await chart(deps, coin, span.from, span.to);
  return { frame, candles: frame === '1m' ? minutes : aggregate(minutes, frame) };
}

// How far before a span a question about it looks for the like of it, in lengths of the span.
const LOOK_BACK = 20;

/** The market around a span: long before it, to find its like, and after it up to now, to see what came next. */
export async function spanSurroundings(deps: Deps, coin: string, span: { from: number; to: number }) {
  const now = deps.clock.now();
  const earliest = deps.exchangeCandles || keepsPast(deps) ? 0 : now - STORED_SPAN;
  const from = Math.max(earliest, span.from - LOOK_BACK * (span.to - span.from));
  return spanCandles(deps, coin, { from, to: now }, 200);
}
