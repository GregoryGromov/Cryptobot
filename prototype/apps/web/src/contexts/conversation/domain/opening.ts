import { DAY_MS, startOfDay } from '~/shared/format/time';

export type OpeningDay = 'today' | 'tomorrow' | 'later';

/** Which day, on the person's calendar, a shut exchange opens: today, tomorrow or a later date. */
export const openingDay = (opensAt: number, now: number): OpeningDay => {
  const days = Math.round((startOfDay(opensAt) - startOfDay(now)) / DAY_MS);
  if (days <= 0) return 'today';
  return days === 1 ? 'tomorrow' : 'later';
};
