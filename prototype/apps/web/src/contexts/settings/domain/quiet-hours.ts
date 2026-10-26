export const hourInstant = (hour: number): number => new Date(2000, 0, 1, hour).getTime();

export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
