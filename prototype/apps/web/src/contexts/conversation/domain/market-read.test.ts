import { describe, expect, it } from 'vitest';
import { type ChartCandle, marketRead, rsiOf } from './market-read';

const candle = (minute: number, close: number, volume = 10): ChartCandle => ({
  t: minute * 60_000,
  o: close,
  h: close + 1,
  l: close - 1,
  c: close,
  v: volume,
});

const flat = (count: number, close = 100): ChartCandle[] =>
  Array.from({ length: count }, (_, minute) => candle(minute, close));

describe('rsiOf', () => {
  it('reads a market that only rose as fully strong', () => {
    expect(rsiOf(Array.from({ length: 20 }, (_, index) => 100 + index))).toBe(100);
  });

  it('reads a market that did not move as even', () => {
    expect(rsiOf(Array.from({ length: 20 }, () => 100))).toBe(50);
  });

  it('has nothing to say without a full period', () => {
    expect(rsiOf([1, 2, 3])).toBeNull();
  });
});

describe('marketRead', () => {
  it('measures the hour from the last close an hour back', () => {
    const candles = [...flat(61), candle(61, 102)];
    expect(marketRead(candles).hour).toBeCloseTo(2, 6);
  });

  it('draws the price over the same hour it measures', () => {
    const candles = [
      ...flat(30, 90),
      ...Array.from({ length: 61 }, (_, index) => candle(30 + index, 100 + index)),
    ];
    const { closes } = marketRead(candles);

    expect(closes.length).toBe(61);
    expect(closes[0]).toBe(100);
    expect(closes.at(-1)).toBe(160);
  });

  it('compares the last five minutes of volume with the usual minute', () => {
    const candles = [...flat(15), ...Array.from({ length: 5 }, (_, index) => candle(15 + index, 100, 40))];
    expect(marketRead(candles).volume).toBeCloseTo(40 / 17.5, 6);
  });

  it('reads nothing from no candles', () => {
    expect(marketRead([])).toEqual({ closes: [], hour: null, volume: null, rsi: null, range: null });
  });
});
