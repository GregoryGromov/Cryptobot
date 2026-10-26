export type FigureParts = {
  readonly whole: string;
  readonly fraction: string;
  readonly tail: string;
};

const LEADING_DIGITS = /^\p{Nd}+/u;

const decimalSeparatorOf = (locale: string): string =>
  new Intl.NumberFormat(locale).formatToParts(0.1).find((p) => p.type === 'decimal')?.value ?? '.';

export const splitFigure = (text: string, locale: string): FigureParts => {
  const separator = decimalSeparatorOf(locale);
  const at = text.lastIndexOf(separator);
  const digits = at < 0 ? '' : (LEADING_DIGITS.exec(text.slice(at + separator.length))?.[0] ?? '');
  if (digits === '') return { whole: text, fraction: '', tail: '' };
  const end = at + separator.length + digits.length;
  return { whole: text.slice(0, at), fraction: text.slice(at, end), tail: text.slice(end) };
};

export const figureFractionClass = 'text-foreground/42';
