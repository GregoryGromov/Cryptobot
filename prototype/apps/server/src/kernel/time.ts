export type Instant = number & { readonly __brand: 'Instant' };
export type Duration = number & { readonly __brand: 'Duration' };
export const MINUTE = 60_000;
export const instant = (value: number): Instant => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid instant');
  return value as Instant;
};
export const minuteFloor = (value: number): Instant => instant(Math.floor(value / MINUTE) * MINUTE);
export const nextMinute = (value: number): Instant => instant(minuteFloor(value) + MINUTE);
export type Clock = { now(): Instant };
export const utcDay = (at: number): number => Math.floor(at / 86_400_000);
