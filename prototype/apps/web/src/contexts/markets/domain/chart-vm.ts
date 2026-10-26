import { type Candle, CHART_FRAMES, type ChartFrame, FRAME_MS } from '@reinforce/server/dto';

export const FRAMES = CHART_FRAMES;
export type Frame = ChartFrame;

const MINUTE = 60_000;

export type Span = { readonly from: number; readonly to: number };

export type SpanFacts = {
  readonly span: Span;
  readonly open: number;
  readonly close: number;
  readonly high: number;
  readonly low: number;
  readonly change: number;
  readonly volumeRatio: number | null;
};

export function snapSpan(a: number, b: number, frame: Frame): Span {
  const step = FRAME_MS[frame];
  const from = Math.floor(Math.min(a, b) / step) * step;
  const to = Math.floor(Math.max(a, b) / step) * step + step;
  return { from, to };
}

const meanVolume = (candles: readonly Candle[]) => candles.reduce((sum, c) => sum + c.v, 0) / candles.length;

export function spanFacts(candles: readonly Candle[], span: Span, frame: Frame): SpanFacts | null {
  const inside = candles.filter((c) => c.t >= span.from && c.t < span.to);
  const first = inside[0];
  const last = inside[inside.length - 1];
  if (!first || !last) return null;
  const usual = meanVolume(candles);
  return {
    span: { from: first.t, to: last.t + FRAME_MS[frame] },
    open: first.o,
    close: last.c,
    high: Math.max(...inside.map((c) => c.h)),
    low: Math.min(...inside.map((c) => c.l)),
    change: (last.c / first.o - 1) * 100,
    volumeRatio: usual > 0 ? meanVolume(inside) / usual : null,
  };
}

/** What a picked span showed when it was picked: enough to word the questions about it. */
export type SpanGist = {
  readonly change: number;
  readonly volumeRatio: number | null;
  readonly latest: boolean;
};

export function spanGist(candles: readonly Candle[], span: Span, frame: Frame): SpanGist | null {
  const facts = spanFacts(candles, span, frame);
  const last = candles.at(-1);
  if (!facts || !last) return null;
  return { change: facts.change, volumeRatio: facts.volumeRatio, latest: facts.span.to > last.t };
}

const NOTABLE_MOVE_PCT = 0.3;
const NOTABLE_VOLUME = 2;

export type SpanAsk =
  | { readonly kind: 'what' }
  | { readonly kind: 'move'; readonly change: number }
  | { readonly kind: 'volume'; readonly ratio: number }
  | { readonly kind: 'moveVolume'; readonly change: number; readonly ratio: number }
  | { readonly kind: 'before' | 'beforeRise' | 'beforeFall' }
  | { readonly kind: 'next' | 'after' };

/** The three questions a picked span invites: about itself, its like before, and what followed it. */
export function spanAsks(gist: SpanGist | null): readonly SpanAsk[] {
  if (!gist) return [{ kind: 'what' }, { kind: 'before' }, { kind: 'next' }];
  const moved = Math.abs(gist.change) >= NOTABLE_MOVE_PCT;
  const ratio = gist.volumeRatio !== null && gist.volumeRatio >= NOTABLE_VOLUME ? gist.volumeRatio : null;
  return [
    askItself(moved, gist.change, ratio),
    askLike(moved, gist.change),
    { kind: gist.latest ? 'next' : 'after' },
  ];
}

function askItself(moved: boolean, change: number, ratio: number | null): SpanAsk {
  if (ratio === null) return moved ? { kind: 'move', change } : { kind: 'what' };
  return moved ? { kind: 'moveVolume', change, ratio } : { kind: 'volume', ratio };
}

function askLike(moved: boolean, change: number): SpanAsk {
  if (!moved) return { kind: 'before' };
  return { kind: change > 0 ? 'beforeRise' : 'beforeFall' };
}

/** A detector's signal: the end of the minute it fired on, in ms, and which way it called. */
export type SignalMark = { readonly at: number; readonly direction: 'UP' | 'DOWN' };

export type MarkedCandle = { readonly t: number; readonly direction: SignalMark['direction'] };

/** The candles of a frame that signals fired on, in time order: one mark per candle and way, none off the chart. */
export function markedCandles(
  candles: readonly Candle[],
  marks: readonly SignalMark[],
  frame: Frame,
): readonly MarkedCandle[] {
  const step = FRAME_MS[frame];
  const seen = new Map<string, MarkedCandle>();
  for (const mark of marks) {
    const minute = mark.at - MINUTE;
    const holder = candles[indexBefore(candles, minute + 1)];
    if (!holder || minute >= holder.t + step) continue;
    seen.set(`${holder.t}|${mark.direction}`, { t: holder.t, direction: mark.direction });
  }
  return [...seen.values()].sort((a, b) => a.t - b.t);
}

/** How the drawn chart lays candles out: candle `i` stands at `x0 + i * step` on a pane of this size. */
export type ChartView = {
  readonly width: number;
  readonly height: number;
  readonly x0: number;
  readonly step: number;
};

function indexFrom(candles: readonly Candle[], at: number): number {
  return candles.findIndex((c) => c.t >= at);
}

function indexBefore(candles: readonly Candle[], at: number): number {
  for (let i = candles.length - 1; i >= 0; i--)
    if ((candles[i]?.t ?? Number.POSITIVE_INFINITY) < at) return i;
  return -1;
}

/** Where a span's edges stand on the pane, cut to it; null while none of its candles is in sight. */
export function spanEdges(
  candles: readonly Candle[],
  span: Span,
  view: ChartView,
): readonly [number, number] | null {
  const first = indexFrom(candles, span.from);
  const last = indexBefore(candles, span.to);
  if (first < 0 || last < first) return null;
  const left = view.x0 + (first - 0.5) * view.step;
  const right = view.x0 + (last + 0.5) * view.step;
  if (right <= 0 || left >= view.width) return null;
  return [Math.max(0, left), Math.min(view.width, right)];
}

/** The whole candles a drag across the pane covers, the nearest ones past either end; null when it misses them all. */
export function dragSpan(
  candles: readonly Candle[],
  view: ChartView,
  a: number,
  b: number,
  frame: Frame,
): Span | null {
  if (view.step <= 0) return null;
  const last = candles.length - 1;
  const left = Math.round((Math.min(a, b) - view.x0) / view.step);
  const right = Math.round((Math.max(a, b) - view.x0) / view.step);
  if (right < 0 || left > last) return null;
  const first = candles[Math.max(0, left)];
  const end = candles[Math.min(last, right)];
  return first && end ? snapSpan(first.t, end.t, frame) : null;
}

// The chart library labels time in UTC, so candles are drawn at the wall-clock moment the viewer reads.
/** Empty slots after the last candle up to the one `until` falls in, room for what is drawn ahead of the price. */
export function slotsAfter(candles: readonly Candle[], until: number, frame: Frame): readonly number[] {
  const last = candles.at(-1);
  if (!last) return [];
  const step = FRAME_MS[frame];
  const slots: number[] = [];
  for (let at = last.t + step; at <= Math.floor(until / step) * step + step; at += step) slots.push(at);
  return slots;
}

/** What a chart opens on around a forecast: its whole range after three times as much before it, at least `bars` candles. */
export function forecastView(t0: number, end: number, frame: Frame, bars: number): Span {
  const step = FRAME_MS[frame];
  const span = end - t0;
  const before = Math.max(3 * span, bars * step - span);
  return { from: Math.floor((t0 - before) / step) * step, to: Math.floor(end / step) * step + step };
}

export const wallSeconds = (at: number): number =>
  Math.floor(at / 1000) - new Date(at).getTimezoneOffset() * 60;

export function fromWallSeconds(seconds: number): number {
  const guess = seconds * 1000;
  return guess + new Date(guess + new Date(guess).getTimezoneOffset() * MINUTE).getTimezoneOffset() * MINUTE;
}
