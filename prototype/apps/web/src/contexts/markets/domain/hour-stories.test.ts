import type { MarketList } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { hourStories } from './hour-stories';

type Market = MarketList[number]['markets'][number];

const market = (coin: string, name: string): Market => ({
  coin,
  key: coin,
  name,
  ticker: coin,
  cls: 'commodities',
  price: 100,
  change1h: 0.5,
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
  spark: [1, 2, 3],
  watched: false,
  opinion: { forecast: null, trade: null, busy: false },
});

const catalog = (markets: Market[]): MarketList => [
  { cls: 'commodities', title: 'Сырьё', watched: false, markets },
];

const story = (list: MarketList, id: string) => {
  const found = hourStories(list).find((item) => item.id === id);
  if (found === undefined) throw new Error(`no story ${id}`);
  return found;
};

describe('the stories of the hour', () => {
  it('tells three stories, each leaning the way its first market went', () => {
    expect(hourStories(catalog([])).map((item) => [item.id, item.direction])).toEqual([
      ['alts', 'down'],
      ['stock', 'up'],
      ['commodities', 'down'],
    ]);
  });

  it('names a market the way the catalog names it', () => {
    const told = story(catalog([market('xyz:CL', 'Нефть')]), 'commodities');
    expect(told.markets.map((item) => item.name)).toEqual(['Нефть', 'BRENTOIL', 'SILVER']);
  });

  it('opens only the markets the catalog lists', () => {
    const told = story(catalog([market('xyz:BRENTOIL', 'Brent')]), 'commodities');
    expect(told.markets.map((item) => item.topic)).toEqual([null, 'xyz:BRENTOIL', null]);
    expect(told.topic).toBe('xyz:BRENTOIL');
  });

  it('has nowhere to go when the catalog lists none of its markets', () => {
    expect(story(catalog([]), 'alts').topic).toBeNull();
  });

  it('measures a story against another market when it has one', () => {
    const list = catalog([market('BTC', 'Bitcoin')]);
    expect(story(list, 'alts').against?.name).toBe('Bitcoin');
    expect(story(list, 'commodities').against).toBeNull();
  });
});
