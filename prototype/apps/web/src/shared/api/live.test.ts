import type { Pulse } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { invalidationsFor } from './live';

const pulse = (over: Partial<Pulse> = {}): Pulse => ({
  accountId: 'a1',
  now: 1_000,
  telegramLinkId: null,
  conversations: { broker: 3, GOLD: 5 },
  market: { phase: 'ready', lastBarEnd: 60_000, loaded: 10, total: 10, message: null },
  ...over,
});

describe('pulse invalidation', () => {
  it('names only the topics whose journal moved', () => {
    expect(
      invalidationsFor(pulse(), pulse({ conversations: { broker: 3, GOLD: 6, BTC: 1 } })).topics,
    ).toEqual(['GOLD', 'BTC']);
  });

  it('treats a new bar as a market change', () => {
    const next = pulse({
      market: { phase: 'ready', lastBarEnd: 120_000, loaded: 10, total: 10, message: null },
    });
    expect(invalidationsFor(pulse(), next)).toEqual({
      account: false,
      joined: false,
      market: true,
      topics: [],
      telegram: false,
    });
  });

  it('notices another account', () => {
    expect(invalidationsFor(pulse(), pulse({ accountId: 'a2' })).account).toBe(true);
  });

  it('keeps what a visitor sees when their first act makes them a guest', () => {
    expect(invalidationsFor(pulse({ accountId: null }), pulse({ accountId: 'a1' }))).toMatchObject({
      account: false,
      joined: true,
    });
  });

  it('starts over when the person signs out', () => {
    expect(invalidationsFor(pulse(), pulse({ accountId: null })).account).toBe(true);
  });
});
