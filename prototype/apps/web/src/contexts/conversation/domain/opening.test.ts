import { describe, expect, it } from 'vitest';
import { openingDay } from './opening';

const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 30).getTime();

describe('openingDay', () => {
  it('names the day an exchange opens against the person’s own calendar', () => {
    expect([
      openingDay(at(12, 16), at(12, 9)),
      openingDay(at(13, 16), at(12, 23)),
      openingDay(at(12, 16), at(10, 22)),
    ]).toEqual(['today', 'tomorrow', 'later']);
  });
});
