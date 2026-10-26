import { describe, expect, it } from 'vitest';
import {
  closedTrade,
  estimate,
  openTrade,
  pendingTrade,
  proposal,
  rejectedTrade,
  T0,
} from '../testing/fixtures';
import { countdown, dealLevels, dealPhase, scaleOffset } from './deal-phase';

describe('dealPhase', () => {
  it('keeps a live latest proposal open', () => {
    expect(dealPhase(proposal(), T0).kind).toBe('open');
  });

  it('expires an open proposal once its time is up, before the server says so', () => {
    expect(dealPhase(proposal({ expiresAt: T0 }), T0)).toEqual({ kind: 'expired', revisable: true });
  });

  it('treats an open proposal that is not the latest as superseded', () => {
    expect(dealPhase(proposal({ latest: false }), T0).kind).toBe('superseded');
  });

  it('follows the server when it marks a proposal superseded', () => {
    expect(dealPhase(proposal({ status: 'superseded', latest: false }), T0).kind).toBe('superseded');
  });

  it('shows a skipped proposal as skipped', () => {
    expect(dealPhase(proposal({ status: 'skipped' }), T0).kind).toBe('skipped');
  });

  it('lets the latest expired proposal be revised', () => {
    expect(dealPhase(proposal({ status: 'expired' }), T0)).toEqual({ kind: 'expired', revisable: true });
  });

  it('does not offer to revise an expired proposal that is not the latest', () => {
    expect(dealPhase(proposal({ status: 'expired', latest: false }), T0)).toEqual({
      kind: 'expired',
      revisable: false,
    });
  });

  it('waits for the order of a confirmed proposal', () => {
    expect(dealPhase(proposal({ status: 'confirmed' }), T0)).toEqual({
      kind: 'confirmed-pending',
      trade: null,
    });
  });

  it('waits for the entry of a pending order', () => {
    expect(dealPhase(proposal({ status: 'confirmed', trade: pendingTrade() }), T0).kind).toBe(
      'confirmed-pending',
    );
  });

  it('is entered once the trade is open', () => {
    expect(dealPhase(proposal({ status: 'confirmed', trade: openTrade() }), T0).kind).toBe('entered');
  });

  it('is closed once the trade is closed', () => {
    expect(dealPhase(proposal({ status: 'confirmed', trade: closedTrade() }), T0).kind).toBe('closed');
  });

  it('is rejected when the order was not filled', () => {
    expect(dealPhase(proposal({ status: 'confirmed', trade: rejectedTrade() }), T0).kind).toBe('rejected');
  });

  it('lets the trade win over a stale expiry', () => {
    expect(dealPhase(proposal({ expiresAt: T0 - 1, trade: openTrade() }), T0).kind).toBe('entered');
  });
});

describe('dealLevels', () => {
  it('reads an open proposal from the server estimate', () => {
    expect(dealLevels(dealPhase(proposal({ estimate: estimate() }), T0))).toEqual({
      stop: 1980,
      entry: 2000.4,
      take: 2040,
      now: 2000,
    });
  });

  it('has no scale while the estimate waits for a price', () => {
    expect(dealLevels(dealPhase(proposal({ estimate: null }), T0))).toBeNull();
  });

  it('marks an open trade at its last price', () => {
    expect(dealLevels(dealPhase(proposal({ trade: openTrade({ mark: 2011 }) }), T0))).toEqual({
      stop: 1980,
      entry: 2000.4,
      take: 2040,
      now: 2011,
    });
  });

  it('marks a closed trade at its exit', () => {
    expect(dealLevels(dealPhase(proposal({ trade: closedTrade() }), T0))?.now).toBe(2039.6);
  });

  it('has no scale for a skipped proposal', () => {
    expect(dealLevels(dealPhase(proposal({ status: 'skipped' }), T0))).toBeNull();
  });
});

describe('scaleOffset', () => {
  const long = { stop: 1980, entry: 2000, take: 2040, now: null };
  const short = { stop: 2020, entry: 2000, take: 1960, now: null };

  it('puts a long entry a third of the way from the stop', () => {
    expect(scaleOffset(long, 2000)).toBeCloseTo(1 / 3);
  });

  it('puts a short entry a third of the way from the stop', () => {
    expect(scaleOffset(short, 2000)).toBeCloseTo(1 / 3);
  });

  it('holds a price past the target at the end of the scale', () => {
    expect(scaleOffset(long, 2100)).toBe(1);
  });

  it('holds a price past the stop at the start of the scale', () => {
    expect(scaleOffset(long, 1900)).toBe(0);
  });
});

describe('countdown', () => {
  it('counts minutes and seconds', () => {
    expect(countdown(272_000)).toBe('4:32');
  });

  it('rounds a started second up', () => {
    expect(countdown(59_001)).toBe('1:00');
  });

  it('adds hours when they are there', () => {
    expect(countdown(3_725_000)).toBe('1:02:05');
  });

  it('stops at zero', () => {
    expect(countdown(-5_000)).toBe('0:00');
  });
});
