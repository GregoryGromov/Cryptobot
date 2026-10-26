import { formatNumber } from './intl-cache';

export const formatInt = (value: number, locale: string): string =>
  formatNumber(locale, { maximumFractionDigits: 0 }, value);

export const formatDecimal = (value: number, locale: string, digits: number): string =>
  formatNumber(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }, value);
