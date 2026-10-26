import { describe, expect, it } from 'vitest';
import { equitySeries, returnPctOf, stepPoints, withinPeriod } from './equity';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe('equitySeries', () => {
  it('adds closed results to the start in whole cents', () => {
    expect(
      equitySeries({
        start: { at: 0, nav: 10000 },
        closes: [
          { at: 2 * HOUR, pnl: 0.1 },
          { at: HOUR, pnl: 0.2 },
        ],
        end: null,
      }),
    ).toEqual([
      { at: 0, cents: 1_000_000 },
      { at: HOUR, cents: 1_000_020 },
      { at: 2 * HOUR, cents: 1_000_030 },
    ]);
  });

  it('carries losses below the start', () => {
    expect(
      equitySeries({ start: { at: 0, nav: 10000 }, closes: [{ at: HOUR, pnl: -10500 }], end: null }).at(-1),
    ).toEqual({ at: HOUR, cents: -50_000 });
  });

  it('ends on the current value the server gives', () => {
    expect(
      equitySeries({
        start: { at: 0, nav: 10000 },
        closes: [{ at: HOUR, pnl: 12.34 }],
        end: { at: 3 * HOUR, nav: 10015.5 },
      }).at(-1),
    ).toEqual({ at: 3 * HOUR, cents: 1_001_550 });
  });

  it('does not invent a point before the last close', () => {
    expect(
      equitySeries({
        start: { at: 0, nav: 10000 },
        closes: [{ at: 2 * HOUR, pnl: 5 }],
        end: { at: HOUR, nav: 10003 },
      }),
    ).toHaveLength(2);
  });
});

describe('withinPeriod', () => {
  const series = [
    { at: 0, cents: 1_000_000 },
    { at: 5 * DAY, cents: 1_000_500 },
    { at: 9 * DAY, cents: 999_000 },
  ];

  it('opens a period with the value it started at', () => {
    expect(withinPeriod(series, '7d', 10 * DAY)).toEqual([
      { at: 3 * DAY, cents: 1_000_000 },
      { at: 5 * DAY, cents: 1_000_500 },
      { at: 9 * DAY, cents: 999_000 },
    ]);
  });

  it('keeps every point for all time', () => {
    expect(withinPeriod(series, 'all', 10 * DAY)).toEqual(series);
  });

  it('has nothing to draw when no point falls inside the period', () => {
    expect(withinPeriod(series, '1d', 20 * DAY)).toEqual([]);
  });
});

describe('stepPoints', () => {
  it('holds the value flat until the next close', () => {
    expect(
      stepPoints([
        { at: 0, cents: 100 },
        { at: 10, cents: 150 },
        { at: 20, cents: 150 },
      ]),
    ).toEqual([
      { at: 0, cents: 100 },
      { at: 10, cents: 100 },
      { at: 10, cents: 150 },
      { at: 20, cents: 150 },
    ]);
  });
});

describe('returnPctOf', () => {
  it('reads the return of an ended cycle from cents', () => {
    expect(returnPctOf(10000, 10250)).toBe(2.5);
  });

  it('has no return without a start', () => {
    expect(returnPctOf(0, 10)).toBeNull();
  });
});
