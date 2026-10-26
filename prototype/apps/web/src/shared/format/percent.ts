import { formatNumber } from './intl-cache';

export type Direction = 'up' | 'down' | 'flat';

const fixed = (digits: number): Intl.NumberFormatOptions => ({
  style: 'percent',
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

export const formatPercent = (value: number, locale: string, digits = 1): string =>
  formatNumber(locale, fixed(digits), value / 100);

export const formatPercentChange = (value: number, locale: string, digits = 1): string =>
  formatNumber(locale, { ...fixed(digits), signDisplay: 'exceptZero' }, value / 100);

export const moveDigits = (value: number): number => (Math.abs(value) < 1 ? 2 : 1);

export const directionOf = (value: number, digits = 1): Direction => {
  const rounded = Number(value.toFixed(digits));
  if (rounded > 0) return 'up';
  if (rounded < 0) return 'down';
  return 'flat';
};
