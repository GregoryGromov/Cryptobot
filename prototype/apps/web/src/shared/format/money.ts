import { formatNumber } from './intl-cache';

const CENT = 0.01;
const COMPACT_FROM = 10_000;

const currency = (options: Intl.NumberFormatOptions): Intl.NumberFormatOptions => ({
  style: 'currency',
  currency: 'USD',
  roundingMode: 'trunc',
  ...options,
});

export const formatUsd = (value: number, locale: string): string =>
  value !== 0 && Math.abs(value) < CENT
    ? `< ${formatNumber(locale, currency({ minimumFractionDigits: 2 }), CENT)}`
    : formatNumber(locale, currency({ minimumFractionDigits: 2, maximumFractionDigits: 2 }), value);

export const formatUsdWhole = (value: number, locale: string): string =>
  formatNumber(locale, currency({ maximumFractionDigits: 0 }), value);

export const formatUsdSigned = (value: number, locale: string): string =>
  formatNumber(
    locale,
    currency({ minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }),
    value,
  );

export const formatUsdCompact = (value: number, locale: string): string =>
  Math.abs(value) < COMPACT_FROM
    ? formatUsd(value, locale)
    : formatNumber(
        locale,
        currency({ notation: 'compact', minimumSignificantDigits: 3, maximumSignificantDigits: 3 }),
        value,
      );

const priceDigits = (value: number): Intl.NumberFormatOptions => {
  const size = Math.abs(value);
  if (size >= 10_000) return { maximumFractionDigits: 0 };
  if (size >= 10) return { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (size >= 1) return { minimumFractionDigits: 2, maximumFractionDigits: 3 };
  return { minimumSignificantDigits: 2, maximumSignificantDigits: 4 };
};

export const formatPrice = (value: number, locale: string): string =>
  formatNumber(locale, { style: 'currency', currency: 'USD', ...priceDigits(value) }, value);
