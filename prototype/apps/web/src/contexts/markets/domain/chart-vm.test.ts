import type { Candle } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import {
  dragSpan,
  forecastView,
  fromWallSeconds,
  markedCandles,
  slotsAfter,
  snapSpan,
  spanAsks,
  spanEdges,
  spanFacts,
  spanGist,
  wallSeconds,
} from './chart-vm';

const MIN = 60_000;
const candle = (minute: number, o: number, c: number, v = 10): Candle => ({
  t: minute * 5 * MIN,
  o,
  h: Math.max(o, c) + 1,
  l: Math.min(o, c) - 1,
  c,
  v,
});

const candles = [candle(0, 100, 101), candle(1, 101, 99, 30), candle(2, 99, 95, 50), candle(3, 95, 96)];

describe('a span picked on the chart', () => {
  it('snaps both edges to whole candles, whichever way it was dragged', () => {
    expect(snapSpan(12 * MIN, 3 * MIN, '5m')).toEqual({ from: 0, to: 15 * MIN });
  });

  it('runs from the first candle open to the last candle close', () => {
    const facts = spanFacts(candles, { from: 5 * MIN, to: 15 * MIN }, '5m');
    expect(facts).toMatchObject({
      span: { from: 5 * MIN, to: 15 * MIN },
      open: 101,
      close: 95,
      high: 102,
      low: 94,
    });
  });

  it('measures the move from the first open to the last close', () => {
    expect(spanFacts(candles, { from: 5 * MIN, to: 15 * MIN }, '5m')?.change).toBeCloseTo(-5.94, 2);
  });

  it('compares the volume of its candles with the usual candle on the chart', () => {
    expect(spanFacts(candles, { from: 5 * MIN, to: 15 * MIN }, '5m')?.volumeRatio).toBeCloseTo(40 / 25, 5);
  });

  it('has no facts where the chart has no candles', () => {
    expect(spanFacts(candles, { from: 60 * MIN, to: 70 * MIN }, '5m')).toBeNull();
  });
});

describe('wall-clock time for the chart', () => {
  it('turns back into the same moment', () => {
    const at = Date.UTC(2026, 9, 14, 14, 30);
    expect(fromWallSeconds(wallSeconds(at))).toBe(at);
  });
});

describe('a span drawn on the chart', () => {
  const view = { width: 400, height: 200, x0: 100, step: 20 };

  it('covers its candles from the left half of the first to the right half of the last', () => {
    expect(spanEdges(candles, { from: 5 * MIN, to: 15 * MIN }, view)).toEqual([110, 150]);
  });

  it('is cut at the edge of the pane', () => {
    expect(spanEdges(candles, { from: 0, to: 20 * MIN }, { ...view, x0: -30 })).toEqual([0, 40]);
  });

  it('is not drawn while none of its candles is in sight', () => {
    expect(spanEdges(candles, { from: 0, to: 10 * MIN }, { ...view, x0: -200 })).toBeNull();
  });

  it('covers the whole candles a drag crosses', () => {
    expect(dragSpan(candles, view, 141, 105, '5m')).toEqual({ from: 0, to: 15 * MIN });
  });

  it('stops at the last candle when a drag runs past it', () => {
    expect(dragSpan(candles, view, 141, 900, '5m')).toEqual({ from: 10 * MIN, to: 20 * MIN });
  });

  it('covers nothing when a drag stays clear of the candles', () => {
    expect(dragSpan(candles, view, 0, 60, '5m')).toBeNull();
    expect(dragSpan(candles, view, 500, 900, '5m')).toBeNull();
  });
});

describe('the questions a picked span invites', () => {
  it('remembers how the span moved and whether it reaches the latest candle', () => {
    expect(spanGist(candles, { from: 5 * MIN, to: 20 * MIN }, '5m')).toEqual({
      change: expect.closeTo(-4.95, 2),
      volumeRatio: expect.closeTo(1.2, 5),
      latest: true,
    });
    expect(spanGist(candles, { from: 0, to: 10 * MIN }, '5m')?.latest).toBe(false);
  });

  it('asks plainly about a quiet span that ended a while ago', () => {
    expect(spanAsks({ change: 0.1, volumeRatio: 1.1, latest: false })).toEqual([
      { kind: 'what' },
      { kind: 'before' },
      { kind: 'after' },
    ]);
  });

  it('asks about the fall, its like before and what comes next at the latest candle', () => {
    expect(spanAsks({ change: -1.4, volumeRatio: 0.8, latest: true })).toEqual([
      { kind: 'move', change: -1.4 },
      { kind: 'beforeFall' },
      { kind: 'next' },
    ]);
  });

  it('asks where an unusual volume came from', () => {
    expect(spanAsks({ change: 0.1, volumeRatio: 3.2, latest: false })[0]).toEqual({
      kind: 'volume',
      ratio: 3.2,
    });
    expect(spanAsks({ change: 2, volumeRatio: 3.2, latest: false }).slice(0, 2)).toEqual([
      { kind: 'moveVolume', change: 2, ratio: 3.2 },
      { kind: 'beforeRise' },
    ]);
  });

  it('asks the plain questions when nothing is known of the span', () => {
    expect(spanAsks(null)).toEqual([{ kind: 'what' }, { kind: 'before' }, { kind: 'next' }]);
  });
});

describe('signals marked on the chart', () => {
  it('stands each signal on the candle holding its minute, once per candle and way, in time order', () => {
    const marks = [
      { at: 13 * MIN, direction: 'DOWN' as const },
      { at: 6 * MIN, direction: 'UP' as const },
      { at: 9 * MIN, direction: 'UP' as const },
      { at: 10 * MIN, direction: 'DOWN' as const },
    ];
    expect(markedCandles(candles, marks, '5m')).toEqual([
      { t: 5 * MIN, direction: 'UP' },
      { t: 5 * MIN, direction: 'DOWN' },
      { t: 10 * MIN, direction: 'DOWN' },
    ]);
  });

  it('leaves out signals from before or after the candles shown', () => {
    const marks = [
      { at: -4 * MIN, direction: 'UP' as const },
      { at: 21 * MIN, direction: 'DOWN' as const },
    ];
    expect(markedCandles(candles, marks, '5m')).toEqual([]);
  });
});

describe('room ahead of the price', () => {
  it('leaves empty slots after the last candle up to the one the end falls in', () => {
    expect(slotsAfter(candles, 27 * MIN, '5m')).toEqual([20 * MIN, 25 * MIN, 30 * MIN]);
  });

  it('leaves none without candles', () => {
    expect(slotsAfter([], 27 * MIN, '5m')).toEqual([]);
  });
});

describe('the view a forecast opens on', () => {
  it('shows three times the forecast before it when that is wider than the fewest candles', () => {
    expect(forecastView(120 * MIN, 150 * MIN, '1m', 36)).toEqual({ from: 30 * MIN, to: 151 * MIN });
  });

  it('shows at least the fewest candles', () => {
    expect(forecastView(300 * MIN, 330 * MIN, '5m', 36)).toEqual({ from: 150 * MIN, to: 335 * MIN });
  });
});
