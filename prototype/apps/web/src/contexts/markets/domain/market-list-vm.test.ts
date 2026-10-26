import type { MarketList, SignalRow } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import {
  changedBy,
  freshCoins,
  type ListedMarket,
  marketOf,
  marketSignals,
  marketsVm,
  nameOf,
  watchIn,
} from './market-list-vm';

const NONE: ReadonlySet<string> = new Set();

const market = (coin: string, overrides: Partial<ListedMarket> = {}): ListedMarket => ({
  coin,
  key: coin,
  name: coin,
  ticker: coin,
  cls: 'majors',
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
  ...overrides,
});

const catalog = (): MarketList => [
  {
    cls: 'majors',
    title: 'Крупные',
    watched: false,
    markets: [market('BTC', { name: 'Bitcoin', watched: true }), market('ETH', { name: 'Ethereum' })],
  },
  {
    cls: 'commodities',
    title: 'Сырьё',
    watched: false,
    markets: [market('xyz:GOLD', { name: 'Золото', ticker: 'GOLD', cls: 'commodities' })],
  },
  { cls: 'stocks', title: 'Акции', watched: false, markets: [] },
];

const signal = (eventId: string, over: Partial<SignalRow> = {}): SignalRow => ({
  eventId,
  eventAt: 1_000,
  staleAt: 2_000,
  move: 1.2,
  horizon: 15,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: false,
  times: 2,
  spark: null,
  coin: 'BTC',
  name: 'Bitcoin',
  ticker: 'BTC',
  cls: 'majors',
  price: 1,
  change1h: 0,
  chat: 'BTC',
  since: null,
  asked: false,
  threadId: null,
  ...over,
});

describe('the markets list', () => {
  it('lists every market in the order of its class, followed or not', () => {
    const vm = marketsVm(catalog(), { cls: undefined, q: undefined }, NONE);
    expect(vm.rows.map((row) => [row.coin, row.watched])).toEqual([
      ['BTC', true],
      ['ETH', false],
      ['xyz:GOLD', false],
    ]);
  });

  it('counts a class as followed only when every market in it is', () => {
    const vm = marketsVm(watchIn(catalog(), ['ETH'], true), { cls: undefined, q: undefined }, NONE);
    expect(vm.classes).toEqual([
      { cls: 'majors', title: 'Крупные', followed: true, coins: ['BTC', 'ETH'] },
      { cls: 'commodities', title: 'Сырьё', followed: false, coins: ['xyz:GOLD'] },
    ]);
  });

  it('narrows to the class picked', () => {
    const vm = marketsVm(catalog(), { cls: 'commodities', q: undefined }, NONE);
    expect(vm.selected?.cls).toBe('commodities');
    expect(vm.rows.map((row) => row.coin)).toEqual(['xyz:GOLD']);
  });

  it('shows every class for a class it does not know', () => {
    const vm = marketsVm(catalog(), { cls: 'bonds', q: undefined }, NONE);
    expect(vm.selected).toBeNull();
    expect(vm.rows).toHaveLength(3);
  });

  it('finds a market by its ticker whatever the case', () => {
    const vm = marketsVm(catalog(), { cls: undefined, q: '  gold ' }, NONE);
    expect(vm.searching).toBe(true);
    expect(vm.rows.map((row) => row.coin)).toEqual(['xyz:GOLD']);
  });

  it('is left with no rows when a search matches no market', () => {
    expect(marketsVm(catalog(), { cls: undefined, q: 'doge' }, NONE).rows).toEqual([]);
  });

  it('marks the markets whose signal is still fresh', () => {
    const vm = marketsVm(catalog(), { cls: undefined, q: undefined }, new Set(['ETH']));
    expect(vm.rows.map((row) => [row.coin, row.fresh])).toEqual([
      ['BTC', false],
      ['ETH', true],
      ['xyz:GOLD', false],
    ]);
  });

  it('colours the hour by the change as it is shown, to two digits', () => {
    const list: MarketList = [
      {
        cls: 'majors',
        title: 'Крупные',
        watched: false,
        markets: [
          market('UP', { change1h: 0.011 }),
          market('DOWN', { change1h: -0.3 }),
          market('FLAT', { change1h: 0.004 }),
          market('NONE', { change1h: null }),
        ],
      },
    ];
    const vm = marketsVm(list, { cls: undefined, q: undefined }, NONE);
    expect(vm.rows.map((row) => row.direction)).toEqual(['up', 'down', 'flat', 'flat']);
  });
});

describe('a market opened from the list', () => {
  it('is the one asked for', () => {
    expect(marketOf(catalog(), 'xyz:GOLD')?.name).toBe('Золото');
  });

  it('is none when none is asked for or the asked one is unknown', () => {
    expect(marketOf(catalog(), undefined)).toBeNull();
    expect(marketOf(catalog(), 'DOGE')).toBeNull();
  });
});

describe('a market’s signals', () => {
  it('keeps the market’s own signals, newest first', () => {
    const items = [
      signal('old', { eventAt: 1_000 }),
      signal('other', { coin: 'ETH', eventAt: 3_000 }),
      signal('new', { eventAt: 2_000 }),
    ];
    expect(marketSignals(items, 'BTC').map((s) => s.eventId)).toEqual(['new', 'old']);
  });
});

describe('market names', () => {
  it('names a market by its coin, and falls back to the coin when the list has none', () => {
    expect(nameOf(catalog(), 'xyz:GOLD')).toBe('Золото');
    expect(nameOf(catalog(), 'DOGE')).toBe('DOGE');
  });
});

describe('fresh signals', () => {
  it('counts a market until its signal goes stale', () => {
    const signals = [
      { coin: 'BTC', staleAt: 2_000 },
      { coin: 'ETH', staleAt: 1_000 },
    ];
    expect([...freshCoins(signals, 1_000)]).toEqual(['BTC']);
  });
});

describe('following markets', () => {
  it('marks a class followed once its last market is starred', () => {
    const list = watchIn(catalog(), ['ETH'], true);
    expect(list[0]?.watched).toBe(true);
  });

  it('names only the markets a change actually turns', () => {
    expect(changedBy(catalog(), ['BTC', 'ETH'], true)).toEqual(['ETH']);
  });

  it('undoes a failed change without touching a market it did not turn', () => {
    const before = catalog();
    const after = watchIn(before, ['BTC', 'ETH'], true);
    const undone = watchIn(after, changedBy(before, ['BTC', 'ETH'], true), false);
    expect(undone[0]?.markets.map((m) => [m.coin, m.watched])).toEqual([
      ['BTC', true],
      ['ETH', false],
    ]);
  });
});
