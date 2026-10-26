import type { Locale } from '@reinforce/i18n/web';

export const inSentence = (name: string, locale: Locale): string =>
  locale === 'ru'
    ? name.replace(/^([А-ЯЁ])(\p{Ll})/u, (_, a: string, b: string) => a.toLowerCase() + b)
    : name;
