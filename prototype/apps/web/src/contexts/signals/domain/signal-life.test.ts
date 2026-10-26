import { describe, expect, it } from 'vitest';
import { lifeMinutes, signalLife } from './signal-life';

const MINUTE = 60_000;
const AT = Date.UTC(2026, 9, 9, 12, 0);
const signal = { eventAt: AT, staleAt: AT + 15 * MINUTE };

describe('signalLife', () => {
  it('counts the minutes and seconds left and the share of the life still ahead', () => {
    expect(signalLife(signal, AT + 3 * MINUTE)).toEqual({ clock: '12:00', share: 0.8, soon: false });
  });

  it('says the life is running out in its last five minutes', () => {
    expect(signalLife(signal, AT + 10 * MINUTE + 30_000)).toEqual({ clock: '4:30', share: 0.3, soon: true });
  });

  it('rounds a started second up, so the last one reads 0:01', () => {
    expect(signalLife(signal, AT + 15 * MINUTE - 400)?.clock).toBe('0:01');
  });

  it('is over once the signal has gone stale', () => {
    expect(signalLife(signal, AT + 15 * MINUTE)).toBeNull();
  });
});

describe('lifeMinutes', () => {
  it('is how long a signal stays current, in whole minutes', () => {
    expect(lifeMinutes(signal)).toBe(15);
  });
});
