import { describe, expect, it } from 'vitest';
import { closedTrade, openTrade, pendingTrade } from '~/contexts/trading/testing/fixtures';
import { tradeFees } from './trade-detail-vm';

describe('tradeFees', () => {
  it('adds the entry and the exit fee in whole cents', () => {
    expect(
      tradeFees(
        closedTrade({
          entry: { at: 0, refPrice: 1, price: 1, fee: 0.1 },
          exit: { at: 1, refPrice: 1, price: 1, fee: 0.2, reason: 'time' },
        }),
      ),
    ).toBe(0.3);
  });

  it('counts only the entry fee of an open trade', () => {
    expect(tradeFees(openTrade())).toBe(0.23);
  });

  it('has no fee before the entry', () => {
    expect(tradeFees(pendingTrade())).toBeNull();
  });
});
