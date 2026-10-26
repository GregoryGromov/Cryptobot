import type { Candle, MarketList } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import type { ListedMarket } from './market-list-vm';
import { defaultPeers, moveOver, periodMoves, withPeer } from './market-moves';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const candle = (t: number, c: number): Candle => ({ t, o: c, h: c, l: c, c, v: 1 });
const every = (step: number, closes: readonly number[]): Candle[] =>
  closes.map((c, i) => candle(i * step, c));

const market = (coin: string): ListedMarket => ({
  coin,
  key: coin,
  name: coin,
  ticker: coin,
  cls: 'majors',
  price: 100,
  change1h: null,
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
  spark: [],
  watched: false,
  opinion: { forecast: null, trade: null, busy: false },
});

const list: MarketList = [
  { cls: 'majors', title: 'Крупные', watched: false, markets: ['BTC', 'ETH', 'SOL', 'HYPE'].map(market) },
  { cls: 'stocks', title: 'Акции', watched: false, markets: [market('xyz:NVDA')] },
];

describe('market moves', () => {
  it('measures a move from the last close that far back to the latest close', () => {
    expect(moveOver(every(30 * MINUTE, [100, 104, 110]), HOUR)).toBeCloseTo(10);
  });

  it('leaves a move out when the candles do not reach that far back', () => {
    expect(moveOver(every(5 * MINUTE, [100, 101]), HOUR)).toBeNull();
    expect(moveOver([], HOUR)).toBeNull();
  });

  it('gives the hour, four hours and day from 5-minute candles and the week from hourly ones', () => {
    const fiveMinute = every(
      5 * MINUTE,
      Array.from({ length: 289 }, (_, i) => (i === 0 ? 50 : 100)),
    );
    const hourly = every(
      HOUR,
      Array.from({ length: 169 }, (_, i) => (i === 0 ? 200 : 100)),
    );
    expect(periodMoves(fiveMinute, hourly)).toEqual([
      { period: 'hour', change: 0 },
      { period: 'hours4', change: 0 },
      { period: 'day', change: 100 },
      { period: 'week', change: -50 },
    ]);
  });
});

describe('compared markets', () => {
  it('starts from the first two other markets of its class', () => {
    expect(defaultPeers(list, 'ETH')).toEqual(['BTC', 'SOL']);
    expect(defaultPeers(list, 'xyz:NVDA')).toEqual([]);
  });

  it('adds a market only once, never the market itself, and no more than three', () => {
    expect(withPeer(['ETH'], 'SOL', 'BTC')).toEqual(['ETH', 'SOL']);
    expect(withPeer(['ETH'], 'ETH', 'BTC')).toEqual(['ETH']);
    expect(withPeer(['ETH'], 'BTC', 'BTC')).toEqual(['ETH']);
    expect(withPeer(['ETH', 'SOL', 'HYPE'], 'xyz:NVDA', 'BTC')).toEqual(['ETH', 'SOL', 'HYPE']);
  });
});
