import { dateFormat } from './intl-cache';

export const DAY_MS = 86_400_000;

export const formatClock = (at: number, locale: string): string =>
  dateFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(at);

export const formatDay = (at: number, locale: string): string =>
  dateFormat(locale, { day: 'numeric', month: 'short' }).format(at);

export const formatDayWithYear = (at: number, locale: string): string =>
  dateFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(at);

export const formatDateTime = (at: number, locale: string): string =>
  dateFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);

export type CalendarDay = 'today' | 'yesterday' | 'earlier';

export const startOfDay = (at: number): number => new Date(at).setHours(0, 0, 0, 0);

export const calendarDayOf = (at: number, now: number): CalendarDay => {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return 'earlier';
};

/** A wait as it goes, «12 с» or «1 мин 5 с»: a stopwatch's «0:12» reads as a recording's length. */
export const formatElapsed = (seconds: number, locale: string): string => {
  const minutes = Math.floor(seconds / 60);
  return new Intl.DurationFormat(locale, { style: 'narrow' }).format(
    minutes > 0 ? { minutes, seconds: seconds % 60 } : { seconds },
  );
};

export const formatDuration = (ms: number, locale: string): string => {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return new Intl.DurationFormat(locale, { style: 'short' }).format(
    hours > 0 ? { hours, minutes: minutes % 60 } : { minutes },
  );
};
