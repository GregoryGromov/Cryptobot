import { describe, expect, it } from 'vitest';
import { waitSteps } from './wait-steps';

const states = (...args: Parameters<typeof waitSteps>) => waitSteps(...args).map(({ state }) => state);

describe('waitSteps', () => {
  it('starts on the price with everything else ahead', () => {
    expect(states('reading', 0)).toEqual([
      'active',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('tells the snapshot’s parts one by one while the broker reads', () => {
    expect(states('reading', 5_000)).toEqual([
      'done',
      'done',
      'active',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('holds the last part of the snapshot until the broker moves on', () => {
    expect(states('reading', 60_000).slice(0, 4)).toEqual(['done', 'done', 'done', 'active']);
  });

  it('closes the whole snapshot once he weighs the odds, however fast', () => {
    expect(states('odds', 0)).toEqual(['done', 'done', 'done', 'done', 'active', 'pending', 'pending']);
  });

  it('follows the stages he reports to the reasons', () => {
    expect(states('reasons', 9_000).slice(4)).toEqual(['done', 'done', 'active']);
  });
});
