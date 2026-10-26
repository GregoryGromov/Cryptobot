import type { Scale } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { breadthParts, compareBars, ratioGeometry, scaleDigits, trackGeometry } from './figure-vm';

const rsi: Scale = {
  min: 0,
  max: 100,
  zones: [
    { from: 0, to: 30, tone: 'down' },
    { from: 70, to: 100, tone: 'up' },
  ],
  trail: [
    { label: '15 мин назад', value: 40 },
    { label: '5 мин назад', value: 55 },
    { label: 'при прогнозе', value: 72 },
  ],
  range: [35, 80],
  ends: ['слабо', 'сильно'],
};

describe('trackGeometry', () => {
  it('places a value along the inset scale', () => {
    expect(trackGeometry(rsi, 212, false).trail.map((p) => p.x)).toEqual([86, expect.closeTo(116), 150]);
  });

  it('holds a value past the scale at its end', () => {
    const past = { ...rsi, trail: [{ label: 'при прогнозе', value: 130 }] };

    expect(trackGeometry(past, 212, false).trail[0]?.x).toBe(206);
  });

  it('marks only the last point of the trail as now', () => {
    expect(trackGeometry(rsi, 212, false).trail.map((p) => p.last)).toEqual([false, false, true]);
  });

  it('draws the zones as spans of the scale', () => {
    expect(trackGeometry(rsi, 212, false).zones).toEqual([
      { x: 6, width: 60, tone: 'down' },
      { x: 146, width: 60, tone: 'up' },
    ]);
  });

  it('draws the hour range under the track', () => {
    expect(trackGeometry(rsi, 212, false).range).toEqual({ x: 76, width: 90 });
  });

  it('leaves room for the labels when labelled', () => {
    expect(trackGeometry(rsi, 212, true)).toMatchObject({ height: 56, center: 32 });
  });

  it('joins the trail into a line', () => {
    expect(trackGeometry(rsi, 212, false).line).toBe('M86.0,12L116.0,12L150.0,12');
  });

  it('prints two decimals on a narrow scale and none on a wide one', () => {
    expect([scaleDigits({ min: 0, max: 1 }), scaleDigits({ min: 0, max: 100 })]).toEqual([2, 0]);
  });
});

describe('ratioGeometry', () => {
  it('draws the usual as a shorter bar than a ratio above one', () => {
    const bars = ratioGeometry(3, 316);

    expect(bars.usual).toBeLessThan(bars.now);
  });

  it('scales the bars so the larger ends short of the gutter', () => {
    expect(ratioGeometry(3, 316).nowEnd).toBeCloseTo(247.85, 1);
  });
});

describe('breadthParts', () => {
  it('splits the width by shares with a gap between parts', () => {
    const parts = breadthParts({ kind: 'breadth', up: 0.5, flat: 0.25, down: 0.25, total: 40 }, 202);

    expect(parts.map((p) => [p.x, p.width, p.count])).toEqual([
      [0, 99, 20],
      [101, 48.5, 10],
      [151.5, 48.5, 10],
    ]);
  });

  it('gives no counts without a market total', () => {
    const parts = breadthParts({ kind: 'breadth', up: 0.5, flat: 0.25, down: 0.25, total: null }, 202);

    expect(parts.map((p) => p.count)).toEqual([null, null, null]);
  });
});

describe('compareBars', () => {
  it('measures each bar against the largest move, out of half the width', () => {
    const bars = compareBars({
      kind: 'compare',
      rows: [
        { label: 'SOL', coin: 'SOL', value: 2, own: true },
        { label: 'BTC', coin: 'BTC', value: -0.5, own: false },
      ],
    });

    expect(bars.map((b) => b.share)).toEqual([50, 12.5]);
  });
});
