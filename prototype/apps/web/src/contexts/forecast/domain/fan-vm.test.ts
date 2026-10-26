import { describe, expect, it } from 'vitest';
import { candle, forecastNote, T0 } from '../forecast-fixture';
import { fanGeometry, tickDigits } from './fan-vm';

const MINUTE = 60_000;

const candles = [candle(-3, 99.8), candle(-2, 99.9), candle(-1, 100), candle(0, 100.5), candle(1, 101)];

const geometry = (over: Partial<Parameters<typeof fanGeometry>[0]> = {}) =>
  fanGeometry({ forecast: forecastNote(), candles, now: T0 + 2.5 * MINUTE, width: 400, ...over });

describe('fanGeometry', () => {
  it('draws nothing without a price to measure from', () => {
    expect(geometry({ forecast: forecastNote({ p0: null }), candles: [] })).toBeNull();
  });

  it('measures from the last close before the forecast when p0 is unknown', () => {
    expect(geometry({ forecast: forecastNote({ p0: null }) })?.p0).toBe(100);
  });

  it('keeps the last half hour of candles before the forecast', () => {
    const many = Array.from({ length: 40 }, (_, i) => candle(i - 40, 100));

    expect(geometry({ candles: many })?.bars).toHaveLength(30);
  });

  it('puts the forecast start at 38% of a narrow plot', () => {
    expect(geometry()?.t0X).toBeCloseTo(131.96);
  });

  it('gives the history more room on a wide card', () => {
    expect(geometry({ width: 800 })?.t0X).toBeCloseTo(313.64);
  });

  it('spaces the horizons on a square-root clock', () => {
    expect(geometry()?.horizons.map((h) => Math.round(h.x))).toEqual([193, 238, 282, 344]);
  });

  it('offers the crosshair every candle before and after the start, left to right', () => {
    const xs = geometry()?.points.map((p) => p.x) ?? [];

    expect(xs).toHaveLength(5);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('measures a realized close against the forecast price', () => {
    expect(geometry()?.last).toMatchObject({ price: 101, since: expect.closeTo(1), at: T0 + 2 * MINUTE });
  });

  it('draws no realized line before the first minute closes', () => {
    expect(geometry({ now: T0 + 30_000 })?.after).toBeNull();
  });

  it('is live within the forecast hour', () => {
    expect(geometry()?.live).toBe(true);
  });

  it('fits the corridor and the history in the price axis', () => {
    const fan = geometry();

    expect(fan?.lo).toBeCloseTo(99.7);
    expect(fan?.hi).toBeCloseTo(101);
  });
});

describe('tickDigits', () => {
  it('prints as many decimals as the step has', () => {
    expect(tickDigits([99.75, 100, 100.25])).toBe(2);
  });

  it('prints whole numbers for a whole step', () => {
    expect(tickDigits([64_000, 64_250])).toBe(0);
  });
});
