import { useIntlLocale } from '~/shared/i18n';
import { formatPrice, formatUsd, formatUsdCompact, formatUsdSigned, formatUsdWhole } from './money';
import { formatDecimal, formatInt } from './number';
import { formatPercent, formatPercentChange, moveDigits } from './percent';
import {
  formatClock,
  formatDateTime,
  formatDay,
  formatDayWithYear,
  formatDuration,
  formatElapsed,
} from './time';

export type Formatters = {
  readonly usd: (value: number) => string;
  readonly usdWhole: (value: number) => string;
  readonly usdSigned: (value: number) => string;
  readonly usdCompact: (value: number) => string;
  readonly price: (value: number) => string;
  readonly percent: (value: number, digits?: number) => string;
  readonly change: (value: number, digits?: number) => string;
  readonly move: (value: number) => string;
  readonly int: (value: number) => string;
  readonly decimal: (value: number, digits: number) => string;
  readonly clock: (at: number) => string;
  readonly day: (at: number) => string;
  readonly dayWithYear: (at: number) => string;
  readonly dateTime: (at: number) => string;
  readonly duration: (ms: number) => string;
  readonly elapsed: (seconds: number) => string;
};

export const formattersFor = (locale: string): Formatters => ({
  usd: (value) => formatUsd(value, locale),
  usdWhole: (value) => formatUsdWhole(value, locale),
  usdSigned: (value) => formatUsdSigned(value, locale),
  usdCompact: (value) => formatUsdCompact(value, locale),
  price: (value) => formatPrice(value, locale),
  percent: (value, digits) => formatPercent(value, locale, digits),
  change: (value, digits) => formatPercentChange(value, locale, digits),
  move: (value) => formatPercentChange(value, locale, moveDigits(value)),
  int: (value) => formatInt(value, locale),
  decimal: (value, digits) => formatDecimal(value, locale, digits),
  clock: (at) => formatClock(at, locale),
  day: (at) => formatDay(at, locale),
  dayWithYear: (at) => formatDayWithYear(at, locale),
  dateTime: (at) => formatDateTime(at, locale),
  duration: (ms) => formatDuration(ms, locale),
  elapsed: (seconds) => formatElapsed(seconds, locale),
});

export const useFormatters = (): Formatters => formattersFor(useIntlLocale());
