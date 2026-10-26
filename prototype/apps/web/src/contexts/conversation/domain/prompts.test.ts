import type { SignalRow, Signals } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { answer, btc, chatOf, forecastNote, message, said } from './fixtures.test-util';
import {
  brokerText,
  codedText,
  helloOf,
  homeAsks,
  movedNotably,
  nextHints,
  offersHints,
  talkTitle,
} from './prompts';

const words = {
  starters: ['С чего начать?'],
  analysis: ['Что сейчас происходит?'],
  enter: 'Стоит ли входить сейчас?',
  again: 'Обнови прогноз',
};

describe('nextHints', () => {
  it('offers the ways to begin before anything was said', () => {
    expect(nextHints(chatOf({ key: 'broker', items: [answer('hello', 'Я ваш брокер.')] }), words)).toEqual([
      { text: 'С чего начать?', analyze: false },
    ]);
  });

  it('offers the broker’s own guesses after his answer', () => {
    const items = [said('m1', 'Привет'), message({ key: 'm2', text: 'Ответ', followUps: ['А риск?'] })];
    expect(nextHints(chatOf({ items }), words)).toEqual([{ text: 'А риск?', analyze: false }]);
  });

  it('offers analyses in a market with no forecast yet', () => {
    expect(nextHints(chatOf({ key: 'BTC', market: btc }), words)).toEqual([
      { text: 'Что сейчас происходит?', analyze: true },
    ]);
  });

  it('offers the broker’s guesses and one analysis in a market he answered before any forecast', () => {
    const items = [
      said('m1', 'Что тут было?'),
      message({ key: 'm2', text: 'Продавали.', followUps: ['Это разворот?'] }),
    ];
    expect(nextHints(chatOf({ key: 'SOL', market: btc, items }), words)).toEqual([
      { text: 'Это разворот?', analyze: false },
      { text: 'Стоит ли входить сейчас?', analyze: true },
    ]);
  });

  it('adds a fresh forecast after the guesses in an analysed market', () => {
    const items = [message({ key: 'm2', text: 'Ответ', followUps: ['А риск?'] })];
    expect(nextHints(chatOf({ key: 'BTC', market: btc, latestThread: 'thread-1', items }), words)).toEqual([
      { text: 'А риск?', analyze: false },
      { text: 'Обнови прогноз', analyze: true },
    ]);
  });
});

describe('movedNotably', () => {
  it('takes half a percent in an hour, either way, as worth asking about', () => {
    expect([movedNotably(-0.6), movedNotably(0.5), movedNotably(0.2), movedNotably(null)]).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});

describe('offersHints', () => {
  it('offers nothing while the broker is busy', () => {
    expect(offersHints([answer('m1', 'Ответ')], true)).toBe(false);
  });

  it('offers nothing under the user’s own words', () => {
    expect(offersHints([said('m1', 'Вопрос')], false)).toBe(false);
  });

  it('offers hints in an empty conversation', () => {
    expect(offersHints([], false)).toBe(true);
  });
});

describe('helloOf', () => {
  it('takes the first sentence as the heading and the rest as the lead', () => {
    expect(helloOf([answer('hello', 'Я ваш брокер. Спросите о любом рынке.')], 'Привет.')).toEqual({
      head: 'Я ваш брокер.',
      lead: 'Спросите о любом рынке.',
    });
  });

  it('falls back to the given line when the broker said nothing', () => {
    expect(helloOf([], 'Я ваш брокер.')).toEqual({ head: 'Я ваш брокер.', lead: null });
  });
});

describe('talkTitle', () => {
  it('names a talk by its first line', () => {
    expect(talkTitle('Что с золотом?\nи с нефтью')).toBe('Что с золотом?');
  });

  it('cuts a long first line as the server does', () => {
    expect(talkTitle('а'.repeat(70))).toBe(`${'а'.repeat(59)}…`);
  });

  it('has no title for empty words', () => {
    expect(talkTitle('  ')).toBeNull();
  });
});

describe('codedText', () => {
  it('sets the asset code apart at the start of the words', () => {
    expect(codedText('$BTC что будет?', '$BTC')).toEqual({ code: '$BTC', rest: ' что будет?' });
  });

  it('leaves words that do not start with the code alone', () => {
    expect(codedText('А $BTC?', '$BTC')).toEqual({ code: null, rest: 'А $BTC?' });
  });
});

describe('brokerText', () => {
  it('drops words that only repeat the forecast thesis', () => {
    const note = forecastNote('forecast-1', 'thread-1');
    expect(brokerText(message({ key: 'f1', text: note.thesis, forecast: note }))).toBeNull();
  });

  it('keeps words that say more than the forecast', () => {
    const note = forecastNote('forecast-1', 'thread-1');
    expect(brokerText(message({ key: 'f1', text: 'Вход не советую.', forecast: note }))).toBe(
      'Вход не советую.',
    );
  });
});

const signal = (ticker: string, over: Partial<SignalRow> = {}): SignalRow => ({
  eventId: ticker,
  eventAt: 1_000,
  staleAt: 2_000,
  move: 0.44,
  horizon: 5,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: false,
  times: 8,
  spark: null,
  coin: ticker,
  name: ticker,
  ticker,
  cls: 'alts',
  price: 1,
  change1h: 0,
  chat: ticker,
  since: null,
  asked: false,
  threadId: null,
  ...over,
});

const quiet = (movers: { ticker: string; change1h: number }[]): Signals['quiet'] => ({
  kind: 'quiet',
  loading: false,
  markets: 7,
  movers: movers.map(({ ticker, change1h }) => ({
    coin: ticker,
    name: ticker,
    ticker,
    cls: null,
    chat: ticker,
    change1h,
    spark: [],
  })),
});

describe('homeAsks', () => {
  it('asks why the latest signal moved, then for its market’s data', () => {
    const items = [signal('ETH', { eventAt: 500 }), signal('SOL', { eventAt: 900, direction: 'DOWN' })];
    expect(homeAsks({ items, quiet: null })).toEqual([
      { kind: 'why', ticker: 'SOL', move: -0.44, horizon: 5 },
      { kind: 'data', ticker: 'SOL' },
      { kind: 'start' },
    ]);
  });

  it('asks about the hour’s top mover while no signal is fresh', () => {
    const signals = { items: [signal('ETH')], quiet: quiet([{ ticker: 'NVDA', change1h: -1.75 }]) };
    expect(homeAsks(signals)).toEqual([
      { kind: 'why', ticker: 'NVDA', move: -1.75, horizon: 60 },
      { kind: 'data', ticker: 'NVDA' },
      { kind: 'start' },
    ]);
  });

  it('offers the usual ways to begin while nothing is known', () => {
    expect(homeAsks(null)).toEqual([{ kind: 'data', ticker: 'BTC' }, { kind: 'start' }, { kind: 'checks' }]);
    expect(homeAsks({ items: [], quiet: quiet([]) })).toEqual(homeAsks(null));
  });
});
