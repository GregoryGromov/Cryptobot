import { describe, expect, it } from 'vitest';
import { sparkGeometry, sparkSeries } from './spark-vm';

describe('sparkSeries', () => {
  it('leaves the minutes still to come as a gap on a fixed axis', () => {
    const series = sparkSeries({ before: 3, after: 2, values: [1, 2, 3, 4], at: 2 });

    expect(series).toEqual({ values: [1, 2, 3, 4, null], at: 2 });
  });

  it('shifts a short history so the moment stands in its place', () => {
    const series = sparkSeries({ before: 3, after: 2, values: [2, 3, 4], at: 1 });

    expect(series).toEqual({ values: [null, 2, 3, 4, null], at: 2 });
  });
});

describe('sparkGeometry', () => {
  it('marks the moment of the signal at the same place on every line', () => {
    const frame = { width: 96, height: 28, pad: 2 };

    expect(sparkGeometry({ before: 3, after: 2, values: [2, 3, 4], at: 1 }, frame).eventX).toBe(48);
  });
});
