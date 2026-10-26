import { describe, expect, it } from 'vitest';
import { ticket } from '../testing/fixtures';
import { horizonOf, initialDraft, requestIntent, reviewTicket, type TicketDraft } from './ticket-vm';

const draft = (patch: Partial<TicketDraft> = {}): TicketDraft => ({
  side: 'LONG',
  amount: '500',
  stop: '1',
  take: '2',
  horizon: 15,
  ...patch,
});

const review = (patch: Partial<TicketDraft> = {}, price: number | null = 2000) =>
  reviewTicket({ draft: draft(patch), limits: ticket(), instrument: 'xyz:GOLD', price, locale: 'ru' });

describe('initialDraft', () => {
  it('starts at $500 within the limit', () => {
    expect(initialDraft(ticket()).amount).toBe('500');
  });

  it('starts below the limit when the limit is smaller, without cents', () => {
    expect(initialDraft(ticket({ maxUsd: 120.75 })).amount).toBe('120');
  });

  it('starts on 15 minutes when that term is offered', () => {
    expect(initialDraft(ticket()).horizon).toBe(15);
  });

  it('starts on the one term the person trades when only it is offered', () => {
    expect(initialDraft(ticket({ horizons: [30] })).horizon).toBe(30);
  });
});

describe('horizonOf', () => {
  it('keeps the term of the draft while it is offered', () => {
    expect(horizonOf({ horizon: 15 }, ticket())).toBe(15);
  });

  it('moves a draft made before the person changed how they trade onto the term offered now', () => {
    expect(horizonOf({ horizon: 30 }, ticket({ horizons: [5] }))).toBe(5);
  });
});

describe('reviewTicket', () => {
  it('stops at the account reason before reading the fields', () => {
    expect(
      reviewTicket({
        draft: draft(),
        limits: ticket({ blockedReason: 'account-busy' }),
        instrument: 'xyz:GOLD',
        price: 2000,
        locale: 'ru',
      }),
    ).toEqual({ kind: 'blocked', reason: 'account-busy' });
  });

  it('holds an amount above the limit as out of range', () => {
    expect(review({ amount: '1 500' })).toMatchObject({
      amount: { kind: 'problem', problem: { kind: 'range', min: 1, max: 1000 } },
      order: { kind: 'incomplete' },
    });
  });

  it('holds a target below the minimum as out of range', () => {
    expect(review({ take: '0,01' })).toMatchObject({
      take: { kind: 'problem', problem: { kind: 'range', min: 0.1, max: 20 } },
    });
  });

  it('holds a target at the slippage itself as too close', () => {
    const limits = ticket({ slippageBps: 20 });
    expect(
      reviewTicket({
        draft: draft({ take: '0,2' }),
        limits,
        instrument: 'xyz:GOLD',
        price: 2000,
        locale: 'ru',
      }),
    ).toMatchObject({ take: { kind: 'problem', problem: { kind: 'slippage', min: 0.2 } } });
  });

  it('waits for a price before it can order', () => {
    expect(review({}, null)).toMatchObject({ order: { kind: 'unpriced' } });
  });

  it('sends the amount as a decimal string with the parsed levels', () => {
    expect(review({ amount: '750,5', stop: '1,5', take: '3' })).toMatchObject({
      order: {
        kind: 'ready',
        terms: {
          instrument: 'xyz:GOLD',
          side: 'LONG',
          amount: '750.5',
          stopPct: 1.5,
          targetPct: 3,
          horizon: 15,
        },
      },
    });
  });

  it('previews the stop and target prices from the current price', () => {
    expect(review({ stop: '1', take: '2' })).toMatchObject({
      order: { kind: 'ready', preview: { stopPrice: 1980, takePrice: 2040 } },
    });
  });
});

describe('requestIntent', () => {
  const terms = {
    instrument: 'xyz:GOLD',
    side: 'LONG' as const,
    amount: '500',
    stopPct: 1,
    targetPct: 2,
    horizon: 15 as const,
  };

  it('keeps the request id when the same terms are sent again', () => {
    const first = requestIntent(null, terms, () => 'a');
    expect(requestIntent(first, terms, () => 'b').id).toBe('a');
  });

  it('mints a new request id when the terms change', () => {
    const first = requestIntent(null, terms, () => 'a');
    expect(requestIntent(first, { ...terms, amount: '600' }, () => 'b').id).toBe('b');
  });
});
