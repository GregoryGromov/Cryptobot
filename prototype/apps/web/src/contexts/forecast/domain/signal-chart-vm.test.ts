import { describe, expect, it } from 'vitest';
import { candle, forecastNote, horizonNote, T0 } from '../forecast-fixture';
import { corridorKnots, forecastEnd, frameFloor, futureSlots, openingRange, slotOf } from './signal-chart-vm';

const MINUTE = 60_000;

const one = forecastNote({ horizons: [horizonNote(30, { q10: -0.4, expected: 0.2, q90: 0.8 })] });

describe('corridorKnots', () => {
  it('draws no range without a price to measure from', () => {
    expect(corridorKnots(forecastNote({ p0: null }), null)).toEqual([]);
  });

  it('starts the range as a point at the forecast price', () => {
    expect(corridorKnots(one, null)[0]).toEqual({ at: T0, lo: 100, mid: 100, hi: 100 });
  });

  it('ends the range at the horizon’s lower and upper tenth', () => {
    const last = corridorKnots(one, null).at(-1);

    expect(last?.at).toBe(T0 + 30 * MINUTE);
    expect(last?.lo).toBeCloseTo(99.6);
    expect(last?.hi).toBeCloseTo(100.8);
  });

  it('opens the range faster than a straight line', () => {
    const quarter = corridorKnots(one, null)[2];

    expect(quarter?.hi).toBeCloseTo(100.4);
  });

  it('measures from the last close when the forecast has no price', () => {
    expect(corridorKnots(forecastNote({ p0: null }), 50)[0]?.mid).toBe(50);
  });
});

describe('futureSlots', () => {
  it('adds empty minutes after the last candle up to the end of the forecast and one more', () => {
    const slots = futureSlots([candle(-1, 100), candle(0, 100)], T0 + 3 * MINUTE, '1m');

    expect(slots.map((at) => (at - T0) / MINUTE)).toEqual([1, 2, 3, 4]);
  });

  it('adds nothing once the candles reach past the forecast', () => {
    expect(futureSlots([candle(10, 100)], T0 + 3 * MINUTE, '1m')).toEqual([]);
  });

  it('steps in the chosen frame', () => {
    const slots = futureSlots([candle(0, 100)], T0 + 30 * MINUTE, '15m');

    expect(slots.map((at) => (at - T0) / MINUTE)).toEqual([15, 30, 45]);
  });
});

describe('slots and frames', () => {
  it('floors a moment to the frame’s candle', () => {
    expect(frameFloor(T0 + 7 * MINUTE, '5m')).toBe(T0 + 5 * MINUTE);
  });

  it('tells how far into its candle a moment is', () => {
    expect(slotOf(T0 + 7 * MINUTE, '5m')).toEqual({ slot: T0 + 5 * MINUTE, share: 0.4 });
  });

  it('ends the forecast at its longest horizon', () => {
    expect(forecastEnd(one)).toBe(T0 + 30 * MINUTE);
  });

  it('opens on three times as much before the forecast as it lasts', () => {
    expect(openingRange(one, '1m', 36)).toEqual({ from: T0 - 90 * MINUTE, to: T0 + 31 * MINUTE });
  });

  it('opens on more history when the frame wants more bars', () => {
    expect(openingRange(one, '5m', 36).from).toBe(T0 - 150 * MINUTE);
  });
});
