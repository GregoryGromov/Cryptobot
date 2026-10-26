import { describe, expect, it } from 'vitest';
import {
  book,
  closedTrade,
  cycle,
  openTrade,
  pendingTrade,
  rejectedTrade,
  T0,
} from '~/contexts/trading/testing/fixtures';
import { bookView, findTrade } from './book-vm';

const HOUR = 3_600_000;

const twoCycles = () =>
  book({
    currentCycleId: 'cycle-2',
    cycles: [
      cycle({
        id: 'cycle-1',
        number: 1,
        startedAt: T0 - 10 * HOUR,
        endedAt: T0 - 5 * HOUR,
        endNav: -500,
        realized: -10500,
        closedCount: 1,
        maxDrawdownPct: 105,
      }),
      cycle({ id: 'cycle-2', number: 2, startedAt: T0 - 5 * HOUR, previousEndNav: -500 }),
    ],
    rows: [
      closedTrade({
        id: 'loss',
        cycleId: 'cycle-1',
        pnl: -10500,
        exit: { at: T0 - 6 * HOUR, refPrice: 1, price: 1, fee: 1, reason: 'bankruptcy' },
      }),
      closedTrade({ id: 'gain', cycleId: 'cycle-2', pnl: 200 }),
    ],
    nav: 10200,
    capital: 10200,
    asOf: T0 + HOUR,
    returnPct: 2,
  });

describe('bookView', () => {
  it('shows the current cycle by default', () => {
    expect(bookView(twoCycles(), undefined, T0 + HOUR).cycle?.id).toBe('cycle-2');
  });

  it('does not count a reset as profit in the current curve', () => {
    expect(bookView(twoCycles(), undefined, T0 + HOUR).equity.map((point) => point.cents)).toEqual([
      1_000_000, 1_020_000, 1_020_000,
    ]);
  });

  it('keeps the trades of another cycle out', () => {
    expect(bookView(twoCycles(), undefined, T0 + HOUR).done.map((row) => row.id)).toEqual(['gain']);
  });

  it('takes the value and return of the current cycle from the server', () => {
    expect(bookView(twoCycles(), undefined, T0 + HOUR).value).toEqual({
      kind: 'valued',
      nav: 10200,
      returnPct: 2,
      asOf: T0 + HOUR,
    });
  });

  it('opens an ended cycle with its own result and end', () => {
    const view = bookView(twoCycles(), 'cycle-1', T0 + HOUR);
    expect(view.value).toEqual({ kind: 'valued', nav: -500, returnPct: -105, asOf: T0 - 5 * HOUR });
    expect(view.equity.at(-1)).toEqual({ at: T0 - 5 * HOUR, cents: -50_000 });
    expect(view.until).toBe(T0 - 5 * HOUR);
  });

  it('falls back to the current cycle for an unknown cycle in the address', () => {
    expect(bookView(twoCycles(), 'missing', T0).cycle?.id).toBe('cycle-2');
  });

  it('lists the latest cycle first', () => {
    expect(bookView(twoCycles(), undefined, T0).cycles.map((c) => c.number)).toEqual([2, 1]);
  });

  it('waits instead of inventing a value while an open trade has no price', () => {
    const view = bookView(
      book({
        nav: null,
        asOf: null,
        unrealized: null,
        returnPct: null,
        rows: [openTrade({ unrealized: null })],
      }),
      undefined,
      T0,
    );
    expect(view.value).toEqual({ kind: 'awaiting' });
    expect(view.equity).toEqual([{ at: T0 - HOUR, cents: 1_000_000 }]);
  });

  it('puts open and pending trades apart from closed and unfilled ones, latest first', () => {
    const view = bookView(
      book({
        rows: [
          closedTrade({ id: 'closed' }),
          openTrade({ id: 'open', entryAt: T0 }),
          pendingTrade({ id: 'pending', entryAt: T0 + 60_000 }),
          rejectedTrade({ id: 'rejected', entryAt: T0 + 20 * 60_000 }),
        ],
      }),
      undefined,
      T0,
    );
    expect(view.active.map((row) => row.id)).toEqual(['pending', 'open']);
    expect(view.done.map((row) => row.id)).toEqual(['rejected', 'closed']);
  });

  it('draws nothing for a visitor without an account', () => {
    expect(bookView(book({ currentCycleId: null, cycles: [] }), undefined, T0).equity).toEqual([]);
  });
});

describe('findTrade', () => {
  it('finds a trade in either book', () => {
    const user = book({ rows: [openTrade({ id: 'mine' })] });
    const agent = book({ book: 'agent', rows: [closedTrade({ id: 'his' })] });
    expect(findTrade({ user, agent }, 'his')?.id).toBe('his');
  });
});
