import { describe, expect, it } from 'vitest';
import { calendarDayOf, formatDuration, formatElapsed } from './time';

const noon = new Date(2026, 9, 9, 12, 0).getTime();

describe('calendar days', () => {
  it('calls the same day today and the one before yesterday', () => {
    expect(calendarDayOf(new Date(2026, 9, 9, 0, 5).getTime(), noon)).toBe('today');
    expect(calendarDayOf(new Date(2026, 9, 8, 23, 59).getTime(), noon)).toBe('yesterday');
    expect(calendarDayOf(new Date(2026, 9, 7, 23, 59).getTime(), noon)).toBe('earlier');
  });
});

describe('durations', () => {
  it('reads hours and minutes in the page language', () => {
    expect(formatDuration(80 * 60_000, 'ru-RU')).toBe('1 ч 20 мин');
  });

  it('never says zero minutes', () => {
    expect(formatDuration(5_000, 'en-US')).toBe('1 min');
  });
});

describe('a wait as it goes', () => {
  it('reads seconds, then minutes and seconds, in the page language', () => {
    expect([formatElapsed(12, 'ru-RU'), formatElapsed(65, 'ru-RU'), formatElapsed(120, 'en-US')]).toEqual([
      '12 с',
      '1 мин 5 с',
      '2m',
    ]);
  });
});
