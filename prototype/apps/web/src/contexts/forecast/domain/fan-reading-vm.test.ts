import { describe, expect, it } from 'vitest';
import { readDelay, readingBehind, readingFan } from './fan-reading-vm';

const frame = (y: number) => ({
  plotTop: 12,
  plotBottom: 196,
  plotRight: 400,
  origin: { x: 160, y, at: 0, price: 100, since: 0 },
});

describe('readingFan', () => {
  it('opens a cone from the forecast’s start to the plot’s right edge', () => {
    expect(readingFan(frame(100)).cone).toBe('M160.0,100.0L400.0,52.2L400.0,147.8Z');
  });

  it('runs the middle level with the price the forecast starts from', () => {
    expect(readingFan(frame(100)).middle).toBe('M160.0,100.0L400.0,100.0');
  });

  it('keeps the cone inside the plot when the price stands near its edge', () => {
    expect(readingFan(frame(30)).cone).toBe('M160.0,30.0L400.0,18.0L400.0,77.8Z');
  });
});

describe('readDelay', () => {
  const history = { frame: { width: 400, padLeft: 2, padRight: 56 }, t0X: 162 };

  it('reads the first candle as the scan sets off', () => {
    expect(readDelay(2, history)).toBe(0);
  });

  it('reads a candle when the scan reaches it', () => {
    expect(readDelay(82, history)).toBe(857);
  });

  it('reaches the forecast’s start last, and nothing after it later', () => {
    expect([readDelay(162, history), readDelay(300, history)]).toEqual([1714, 1714]);
  });
});

describe('readingBehind', () => {
  it('says how long an analysis has been running', () => {
    expect(readingBehind(1_000, 4_500)).toBe(3_500);
  });

  it('counts nothing before the analysis began', () => {
    expect(readingBehind(5_000, 4_500)).toBe(0);
  });

  it('has nothing to say of a finished forecast', () => {
    expect(readingBehind(undefined, 4_500)).toBeNull();
  });
});
