import { match } from 'ts-pattern';
import type { Locale } from '~/shared/i18n';

type DecimalProblem = 'empty' | 'format' | 'precision';

export type ParsedDecimal =
  | { readonly kind: 'ok'; readonly decimal: string; readonly value: number }
  | { readonly kind: 'error'; readonly problem: DecimalProblem };

const GROUP_MARKS = /[\s,]/g;

const grammarOf = (locale: Locale): RegExp =>
  match(locale)
    .with('ru', () => /^(?<whole>\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](?<fraction>\d*))?$/u)
    .with('en', () => /^(?<whole>\d{1,3}(?:,\d{3})+|\d+)(?:\.(?<fraction>\d*))?$/u)
    .exhaustive();

const parseDecimal = (input: string, locale: Locale, maxFraction: number): ParsedDecimal => {
  const text = input.trim();
  if (text === '') return { kind: 'error', problem: 'empty' };
  const parts = grammarOf(locale).exec(text)?.groups;
  const whole = parts?.whole;
  if (whole === undefined) return { kind: 'error', problem: 'format' };
  const fraction = (parts?.fraction ?? '').replace(/0+$/, '');
  if (fraction.length > maxFraction) return { kind: 'error', problem: 'precision' };
  const digits = whole.replace(GROUP_MARKS, '').replace(/^0+(?=\d)/, '');
  const decimal = fraction === '' ? digits : `${digits}.${fraction}`;
  return { kind: 'ok', decimal, value: Number(decimal) };
};

const CENTS = 2;

export const parseAmount = (input: string, locale: Locale): ParsedDecimal =>
  parseDecimal(input, locale, CENTS);

export const parsePercent = (input: string, locale: Locale): ParsedDecimal =>
  parseDecimal(input, locale, CENTS);
