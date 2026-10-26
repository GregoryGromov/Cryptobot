import type { SignalRow } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { freshEarlier, sinceOf, timesOf, wavesOf } from './waves';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 9, 12, 0);

const row = (eventId: string, over: Partial<SignalRow> = {}): SignalRow => ({
  eventId,
  eventAt: NOW,
  staleAt: NOW + 15 * MINUTE,
  move: 1.2,
  horizon: 15,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: false,
  times: 2,
  spark: null,
  coin: eventId,
  name: eventId,
  ticker: eventId,
  cls: 'alts',
  price: 1,
  change1h: 0,
  chat: eventId,
  since: null,
  asked: false,
  threadId: null,
  ...over,
});

describe('wavesOf', () => {
  it('shows the same market on two exchanges once, as the move it made', () => {
    const waves = wavesOf([
      row('xyz', { coin: 'xyz:SNDK', eventAt: NOW }),
      row('io', { coin: 'io:SNDK', eventAt: NOW - 20_000 }),
      row('down', { coin: 'io:SNDK', direction: 'DOWN', eventAt: NOW - 2 * MINUTE }),
      row('later', { coin: 'io:SNDK', eventAt: NOW - 20 * MINUTE }),
    ]);

    expect(waves.map((w) => w.lead.eventId)).toEqual(['xyz', 'down', 'later']);
  });

  it('keeps a signal about one asset as its own wave', () => {
    const waves = wavesOf([row('SOL'), row('ETH', { eventAt: NOW - MINUTE })]);

    expect(waves.map((w) => [w.lead.eventId, w.with.length])).toEqual([
      ['SOL', 0],
      ['ETH', 0],
    ]);
  });

  it('gathers broad moves the same way close in time into one wave', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'MARKET_WIDE' }),
      row('ETH', { scope: 'BROAD', eventAt: NOW - 4 * MINUTE }),
      row('SOL', { scope: 'BROAD', eventAt: NOW - 8 * MINUTE }),
    ]);

    expect(waves.map((w) => w.with.length)).toEqual([2]);
  });

  it('starts a new wave after a pause longer than the gap', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'BROAD' }),
      row('ETH', { scope: 'BROAD', eventAt: NOW - 7 * MINUTE }),
    ]);

    expect(waves).toHaveLength(2);
  });

  it('keeps moves in opposite directions apart', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'BROAD' }),
      row('ETH', { scope: 'BROAD', direction: 'DOWN', move: -1, eventAt: NOW - MINUTE }),
    ]);

    expect(waves).toHaveLength(2);
  });

  it('leads a wave by its strongest move', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'BROAD', times: 2 }),
      row('DOGE', { scope: 'BROAD', times: 5, eventAt: NOW - 2 * MINUTE }),
    ]);

    expect(waves[0]?.lead.eventId).toBe('DOGE');
  });

  it('names a market that fired twice in a wave once', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'BROAD' }),
      row('ETH', { scope: 'BROAD', eventAt: NOW - MINUTE }),
      row('BTC-2', { scope: 'BROAD', coin: 'BTC', eventAt: NOW - 2 * MINUTE }),
    ]);

    expect(waves[0]?.with).toHaveLength(1);
  });

  it('keeps a wave news while any of its markets is', () => {
    const waves = wavesOf([
      row('BTC', { scope: 'BROAD', times: 5 }),
      row('ETH', { scope: 'BROAD', eventAt: NOW + MINUTE, staleAt: NOW + 16 * MINUTE }),
    ]);

    expect(waves[0]?.staleAt).toBe(NOW + 16 * MINUTE);
  });

  it('puts the latest wave first', () => {
    const waves = wavesOf([row('OLD', { eventAt: NOW - 30 * MINUTE }), row('NEW')]);

    expect(waves.map((w) => w.key)).toEqual(['NEW', 'OLD']);
  });
});

describe('signal facts', () => {
  it('gives how many times stronger than usual from two on', () => {
    expect([timesOf({ times: 3.4 }), timesOf({ times: 1.6 }), timesOf({ times: null })]).toEqual([
      3,
      2,
      null,
    ]);
  });

  it('gives no times below two', () => {
    expect(timesOf({ times: 1.4 })).toBeNull();
  });

  it('tells the move since a signal only once it is not brand new', () => {
    expect([
      sinceOf({ since: 0.4, eventAt: NOW }, NOW + MINUTE),
      sinceOf({ since: 0.4, eventAt: NOW }, NOW + 3 * MINUTE),
    ]).toEqual([null, 0.4]);
  });

  it('folds only the fresh earlier signals above the live one', () => {
    const earlier = [row('LIVE'), row('FRESH'), row('OLD', { staleAt: NOW - MINUTE })];

    expect(freshEarlier(row('LIVE'), earlier, NOW).map((s) => s.eventId)).toEqual(['FRESH']);
  });
});
