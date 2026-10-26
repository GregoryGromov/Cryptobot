import type { MarketList } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { freshCoinsOf, tapeCopiesOf, tapeQuotesOf } from './tape';

const opinion = { forecast: null, trade: null, busy: false };
const day = {
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
};

const catalog: MarketList = [
  {
    cls: 'majors',
    title: 'Крупные',
    watched: true,
    markets: [
      {
        key: 'BTC',
        coin: 'BTC',
        name: 'Bitcoin',
        ticker: 'BTC',
        cls: 'majors',
        price: 60_000,
        change1h: 0.4,
        spark: [],
        watched: true,
        opinion,
        ...day,
      },
      {
        key: 'ETH',
        coin: 'ETH',
        name: 'Ethereum',
        ticker: 'ETH',
        cls: 'majors',
        price: null,
        change1h: null,
        spark: [],
        watched: false,
        opinion,
        ...day,
      },
    ],
  },
  {
    cls: 'alts',
    title: 'Альткоины',
    watched: false,
    markets: [
      {
        key: 'BTC',
        coin: 'BTC',
        name: 'Bitcoin',
        ticker: 'BTC',
        cls: 'majors',
        price: 60_000,
        change1h: 0.4,
        spark: [],
        watched: true,
        opinion,
        ...day,
      },
    ],
  },
];

describe('the tape', () => {
  it('quotes each priced market once', () => {
    expect(tapeQuotesOf(catalog).map((quote) => quote.coin)).toEqual(['BTC']);
  });

  it('keeps a priced market whose hour change is not known yet', () => {
    const hourless: MarketList = [
      { ...catalog[0]!, markets: [{ ...catalog[0]!.markets[0]!, change1h: null }] },
    ];
    expect(tapeQuotesOf(hourless).map((quote) => [quote.coin, quote.change1h])).toEqual([['BTC', null]]);
  });

  it('marks only markets whose signal is still fresh', () => {
    const signals = [
      { coin: 'BTC', staleAt: 2_000 },
      { coin: 'SOL', staleAt: 500 },
    ];
    expect([...freshCoinsOf(signals, 1_000)]).toEqual(['BTC']);
  });

  it('repeats a short list more times so the run never shows a gap', () => {
    expect([tapeCopiesOf(5), tapeCopiesOf(12)]).toEqual([4, 2]);
  });
});
