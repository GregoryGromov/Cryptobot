import type { Locale } from '@reinforce/i18n/web';
import { match } from 'ts-pattern';

export type ParsedAmount =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'amount'; readonly value: number; readonly decimal: string };

type Grammar = { readonly pattern: RegExp; readonly group: string };

const grammarOf = (locale: Locale): Grammar =>
  match(locale)
    .with('ru', (): Grammar => ({ pattern: /^(\d{1,3}(?: \d{3})+|\d+)(?:[.,](\d{1,2}))?$/, group: ' ' }))
    .with('en', (): Grammar => ({ pattern: /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/, group: ',' }))
    .exhaustive();

export const parseAmount = (input: string, locale: Locale): ParsedAmount => {
  const text = input.trim().replace(/\s+/g, ' ');
  if (text === '') return { kind: 'empty' };
  const { pattern, group } = grammarOf(locale);
  const found = pattern.exec(text);
  if (!found) return { kind: 'invalid' };
  const whole = (found[1] ?? '').replaceAll(group, '').replace(/^0+(?=\d)/, '');
  const fraction = found[2];
  const decimal = fraction === undefined ? whole : `${whole}.${fraction}`;
  return { kind: 'amount', value: Number(decimal), decimal };
};

type AmountProblem = 'required' | 'format' | 'positive' | 'max';

export type CheckedAmount =
  | { readonly kind: 'ok'; readonly value: number; readonly decimal: string }
  | { readonly kind: 'problem'; readonly problem: AmountProblem };

export const checkAmount = (parsed: ParsedAmount, max: number): CheckedAmount =>
  match(parsed)
    .with({ kind: 'empty' }, (): CheckedAmount => ({ kind: 'problem', problem: 'required' }))
    .with({ kind: 'invalid' }, (): CheckedAmount => ({ kind: 'problem', problem: 'format' }))
    .with({ kind: 'amount' }, (amount): CheckedAmount => {
      if (amount.value <= 0) return { kind: 'problem', problem: 'positive' };
      if (amount.value > max) return { kind: 'problem', problem: 'max' };
      return { kind: 'ok', value: amount.value, decimal: amount.decimal };
    })
    .exhaustive();

export type CheckedCount =
  | { readonly kind: 'ok'; readonly value: number }
  | { readonly kind: 'problem'; readonly problem: 'format' | 'range' };

export const checkCount = (
  input: string,
  bounds: { readonly min: number; readonly max: number },
): CheckedCount => {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return { kind: 'problem', problem: 'format' };
  const value = Number(text);
  if (value < bounds.min || value > bounds.max) return { kind: 'problem', problem: 'range' };
  return { kind: 'ok', value };
};
