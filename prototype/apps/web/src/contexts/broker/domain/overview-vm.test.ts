import { describe, expect, it } from 'vitest';
import { scoreOf } from './overview-vm';

const terms = [
  { horizon: 5 as const, n: 12, hits: 5 },
  { horizon: 15 as const, n: 40, hits: 30 },
  { horizon: 30 as const, n: 38, hits: 23 },
  { horizon: 60 as const, n: 3, hits: 3 },
];

describe('how the broker’s forecasts come true', () => {
  it('is told in tenths on the term the person trades', () => {
    expect(scoreOf(terms, 30)).toEqual({ kind: 'tenths', tenths: 6, n: 38 });
  });

  it('follows the term when the person changes how they trade', () => {
    expect(scoreOf(terms, 5)).toEqual({ kind: 'tenths', tenths: 4, n: 12 });
  });

  it('is not told before ten checks, however they went', () => {
    expect(scoreOf(terms, 60)).toEqual({ kind: 'early', n: 3 });
  });

  it('starts from nothing for a term never checked', () => {
    expect(scoreOf([], 30)).toEqual({ kind: 'early', n: 0 });
  });
});
