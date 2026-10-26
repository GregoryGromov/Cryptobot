import type { Candle } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { bandLines, indicatorLines, loudCandles, rsiLine, vwapBars, vwapLine } from './indicators';

const MINUTE = 60_000;

const candle = (t: number, c: number, v = 1, h = c, l = c): Candle => ({ t, o: c, h, l, c, v });

describe('indicators', () => {
  it('averages the hour over the candles inside it, and not on frames of an hour or more', () => {
    expect(vwapBars(MINUTE)).toBe(60);
    expect(vwapBars(5 * MINUTE)).toBe(12);
    expect(vwapBars(15 * MINUTE)).toBe(4);
    expect(vwapBars(60 * MINUTE)).toBeNull();
  });

  it('weighs each candle in the average price by what it traded', () => {
    const candles = [candle(0, 10, 1), candle(1, 20, 3), candle(2, 30, 1)];
    expect(vwapLine(candles, 2)).toEqual([
      { t: 1, value: 17.5 },
      { t: 2, value: 22.5 },
    ]);
  });

  it('draws the usual range two deviations around the mean of 20 closes', () => {
    const candles = Array.from({ length: 20 }, (_, i) => candle(i, i % 2 === 0 ? 9 : 11));
    expect(bandLines(candles)).toEqual({ upper: [{ t: 19, value: 12 }], lower: [{ t: 19, value: 8 }] });
  });

  it('reads RSI 100 when the closes only rose and 0 when they only fell', () => {
    const rising = Array.from({ length: 15 }, (_, i) => candle(i, 100 + i));
    const falling = Array.from({ length: 15 }, (_, i) => candle(i, 100 - i));
    expect(rsiLine(rising)).toEqual([{ t: 14, value: 100 }]);
    expect(rsiLine(falling)).toEqual([{ t: 14, value: 0 }]);
  });

  it('marks a candle loud when it traded at least twice the mean of the 48 before it', () => {
    const candles = [
      ...Array.from({ length: 48 }, (_, i) => candle(i, 100, 10)),
      candle(48, 100, 19),
      candle(49, 100, 21),
    ];
    expect([...loudCandles(candles)]).toEqual([49]);
  });

  it('draws nothing when no indicator is shown and only the ones shown otherwise', () => {
    const candles = Array.from({ length: 30 }, (_, i) => candle(i, 100 + (i % 3)));
    expect(indicatorLines(candles, [], 12)).toBeNull();
    expect(indicatorLines(candles, ['rsi'], 12)).toMatchObject({ vwap: null, bands: null, loud: null });
    expect(indicatorLines(candles, ['vwap'], null)?.vwap).toBeNull();
  });
});
