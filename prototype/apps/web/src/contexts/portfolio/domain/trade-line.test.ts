import { describe, expect, it } from 'vitest';
import { closedTrade, openTrade, pendingTrade, T0 } from '~/contexts/trading/testing/fixtures';
import { firstPage, returnOnAmount, tradeClose } from './trade-line';

const MINUTE = 60_000;

describe('returnOnAmount', () => {
  it('gives the result as a share of the amount put in', () => {
    expect(returnOnAmount(2.34, 800)).toBeCloseTo(0.2925, 6);
    expect(returnOnAmount(-11.42, 950)).toBeCloseTo(-1.2021, 4);
  });

  it('counts in cents, so a float tail does not move the share', () => {
    expect(returnOnAmount(0.1 + 0.2, 30)).toBe(1);
  });

  it('has no share of an empty amount', () => {
    expect(returnOnAmount(5, 0)).toBeNull();
  });
});

describe('tradeClose', () => {
  it('tells when an open trade closes by itself and how long is left', () => {
    const row = openTrade({ exitDeadline: T0 + 15 * MINUTE });

    expect(tradeClose(row, T0 + 5 * MINUTE)).toEqual({
      kind: 'due',
      at: T0 + 15 * MINUTE,
      left: 10 * MINUTE,
    });
  });

  it('stops counting once the deadline has passed', () => {
    const row = openTrade({ exitDeadline: T0 + 15 * MINUTE });

    expect(tradeClose(row, T0 + 15 * MINUTE)).toEqual({ kind: 'waiting' });
  });

  it('does not count for a trade that has not entered or is already closed', () => {
    expect(tradeClose(pendingTrade(), T0)).toEqual({ kind: 'waiting' });
    expect(tradeClose(closedTrade(), T0)).toEqual({ kind: 'waiting' });
  });
});

describe('firstPage', () => {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('keeps the eight latest rows until all are asked for', () => {
    expect(firstPage(rows, false)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('gives every row once all are asked for', () => {
    expect(firstPage(rows, true)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
