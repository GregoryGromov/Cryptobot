import type { TradeRow } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { btc, chatOf, NOON } from './fixtures.test-util';
import { headView, positionTag } from './head-vm';

const base = {
  id: 'trade-1',
  cycleId: 'cycle-1',
  book: 'user',
  coin: 'BTC',
  name: 'Bitcoin',
  side: 'LONG',
  horizon: 15,
  stopLossPct: 1,
  takeProfitPct: 2,
  entryAt: NOON,
  exitDeadline: NOON + 900_000,
  source: 'manual',
  note: '',
  requested: 100,
  requestedPct: null,
  threadId: null,
} as const;

const fill = { at: NOON, refPrice: 64_000, price: 64_010, fee: 0.05 };

const open: TradeRow = {
  ...base,
  status: 'open',
  entry: fill,
  notional: 100,
  qty: 0.0015,
  stopPrice: 63_400,
  takePrice: 65_300,
  mark: 64_100,
  unrealized: 12.3,
  markAt: NOON,
  valuation: 'priced',
};

describe('positionTag', () => {
  it('shows an open trade with its unrealized result', () => {
    expect(positionTag(open)).toEqual({ kind: 'open', side: 'LONG', pnl: 12.3 });
  });

  it('shows a trade still entering', () => {
    expect(positionTag({ ...base, status: 'pending', waitingFor: 'time' })).toEqual({
      kind: 'entering',
      side: 'LONG',
    });
  });

  it('shows nothing without a trade', () => {
    expect(positionTag(null)).toBeNull();
  });
});

describe('headView', () => {
  it('names the general conversation', () => {
    expect(headView(chatOf({ key: 'broker' }))).toEqual({ kind: 'general' });
  });

  it('names a talk by its title', () => {
    expect(headView(chatOf({ key: 'talk-a', title: 'Что с золотом?' }))).toEqual({
      kind: 'talk',
      title: 'Что с золотом?',
    });
  });

  it('offers a trade in a market with a ticket', () => {
    const ticket = {
      minUsd: 1,
      maxUsd: 1000,
      freeUsd: 1000,
      blockedReason: null,
      stopLossPct: { min: 0.1, max: 10 },
      takeProfitPct: { min: 0.1, max: 20 },
      horizons: [5, 15, 30, 60],
      feeRate: 0.0005,
      slippageBps: 2,
      costPct: 0.14,
    } as const;
    expect(headView(chatOf({ key: 'BTC', market: btc, ticket }))).toEqual({
      kind: 'market',
      market: btc,
      position: null,
      trade: true,
    });
  });
});
