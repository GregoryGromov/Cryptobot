export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
/** When nothing the person or their browser prefers is supported. */
export const FALLBACK_LOCALE: Locale = 'en';
/** The language a person chose on the site. The server reads it too, so its own words follow the page. */
export const LOCALE_COOKIE = 'locale';

export const isLocale = (value: unknown): value is Locale => (LOCALES as readonly unknown[]).includes(value);

/** The first supported language of a preference list: "en-GB" is English, "ru-RU" Russian. */
export function matchLocale(tags: readonly string[]): Locale | null {
  for (const tag of tags) {
    const base = tag.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** The languages of an Accept-Language header, the preferred first. */
export function acceptedLanguages(header: string | null | undefined): string[] {
  return (header ?? '')
    .split(',')
    .map((part, i) => {
      const [tag = '', ...params] = part.split(';').map((s) => s.trim());
      const q = params.find((p) => p.startsWith('q='));
      return { tag, q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((l) => l.tag && l.tag !== '*' && l.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
    .map((l) => l.tag);
}

/** Numbers and dates are written the way the text around them is. */
export const intlLocale = (locale: Locale): string => (locale === 'ru' ? 'ru-RU' : 'en-US');

/** A result in dollars as the site writes it: "+$12,34" in Russian, "−$12.34" in English. */
export const signedUsd = (n: number, locale: Locale): string =>
  (n > 0 ? '+' : n < 0 ? '−' : '') +
  '$' +
  new Intl.NumberFormat(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(n),
  );
