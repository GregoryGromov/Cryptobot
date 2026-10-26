import type { Figure } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { candlesMini, miniFigure, oddsMini, priceMove, stackTop } from './mini-vm';

const price = (closes: number[], span: number | null): Extract<Figure, { kind: 'price' }> => ({
  kind: 'price',
  startAt: 0,
  closes,
  volumes: null,
  usualVolume: null,
  volumeTimes: null,
  span,
  levels: [],
});

const rsi: Figure = {
  kind: 'scale',
  min: 0,
  max: 100,
  zones: [
    { from: 0, to: 30, tone: 'down' },
    { from: 70, to: 100, tone: 'up' },
  ],
  trail: [
    { label: '15 мин назад', value: 50 },
    { label: '5 мин назад', value: 80 },
    { label: 'при прогнозе', value: 65 },
  ],
  range: [34, 80],
  ends: null,
};

describe('priceMove', () => {
  it('measures the move over the marked minutes', () => {
    expect(priceMove(price([100, 102, 104, 103], 2))).toBeCloseTo(0.98, 2);
  });

  it('measures the whole line when no minutes are marked', () => {
    expect(priceMove(price([100, 102, 104, 103], null))).toBeCloseTo(3, 5);
  });

  it('gives no move for a line with no prices', () => {
    expect(priceMove(price([], 2))).toBeNull();
  });
});

describe('miniFigure', () => {
  it('splits a price line at the marked minutes, so the move stands apart from what came before', () => {
    const mini = miniFigure(price([100, 101, 102, 101], 1));

    expect(mini).toMatchObject({
      kind: 'price',
      before: 'M3.0,19.0L27.7,11.0L52.3,3.0',
      marked: 'M52.3,3.0L77.0,11.0',
      end: { x: 77, y: 11 },
    });
  });

  it('marks nothing on a price line with no marked minutes', () => {
    expect(miniFigure(price([100, 101, 102], null))).toMatchObject({ kind: 'price', marked: null });
  });

  it('draws no price line from a single price', () => {
    expect(miniFigure(price([100], null))).toBeNull();
  });

  it('places an indicator now and where it came from along its scale', () => {
    expect(miniFigure(rsi)).toMatchObject({
      kind: 'scale',
      track: { x: 3, width: 74 },
      from: expect.closeTo(62.2),
      now: expect.closeTo(51.1),
    });
  });

  it('holds an indicator past its scale at the end', () => {
    const past: Figure = { ...rsi, trail: [{ label: 'при прогнозе', value: 140 }] };

    expect(miniFigure(past)).toMatchObject({ kind: 'scale', from: null, now: 77 });
  });

  it('draws the usual as the shorter bar of a ratio above one', () => {
    expect(miniFigure({ kind: 'ratio', value: 8 })).toEqual({ kind: 'ratio', usual: 10, now: 80 });
  });

  it('draws now as the shorter bar of a ratio below one', () => {
    expect(miniFigure({ kind: 'ratio', value: 0.5 })).toEqual({ kind: 'ratio', usual: 80, now: 40 });
  });

  it('splits markets by share and leaves out a share of none', () => {
    const mini = miniFigure({ kind: 'breadth', up: 0.25, flat: 0, down: 0.75, total: 20 });

    expect(mini).toEqual({
      kind: 'breadth',
      parts: [
        { key: 'up', x: 0, width: 19.5 },
        { key: 'down', x: 21.5, width: 58.5 },
      ],
    });
  });

  it('sets falls left of the middle and rises right of it, against the largest move', () => {
    const mini = miniFigure({
      kind: 'compare',
      rows: [
        { label: 'SOL', coin: 'SOL', value: 2, own: true },
        { label: 'BTC', coin: 'BTC', value: -1, own: false },
      ],
    });

    expect(mini).toEqual({
      kind: 'compare',
      center: 40,
      bars: [
        { label: 'SOL', own: true, x: 40, width: 40 },
        { label: 'BTC', own: false, x: 20, width: 20 },
      ],
    });
  });

  it('has no picture for a bare number', () => {
    expect(miniFigure({ kind: 'number', text: '0,39' })).toBeNull();
  });
});

describe('stackTop', () => {
  it('centres a stack of bars in the picture', () => {
    expect([stackTop(1, 0), stackTop(2, 4), stackTop(4, 2)]).toEqual([9.5, 6, 2]);
  });
});

describe('previews in «Все данные»', () => {
  it('draws the candles as one grey line that ends in a dot', () => {
    expect(candlesMini([10, 12, 11])).toEqual({
      kind: 'price',
      before: 'M3.0,19.0L40.0,3.0L77.0,11.0',
      marked: null,
      end: { x: 77, y: 11 },
    });
  });

  it('lays the odds down to up across the picture and lights the likeliest', () => {
    expect(
      oddsMini([
        { cls: 'DOWN', tenths: 2, lead: false },
        { cls: 'FLAT', tenths: 0, lead: false },
        { cls: 'UP', tenths: 6, lead: true },
      ]),
    ).toEqual({
      kind: 'odds',
      parts: [
        { x: 0, width: 19.5, cls: 'DOWN', lead: false },
        { x: 21.5, width: 58.5, cls: 'UP', lead: true },
      ],
    });
  });

  it('has no strip when no odds are given', () => {
    expect(oddsMini([{ cls: 'UP', tenths: 0, lead: true }])).toBeNull();
  });
});
