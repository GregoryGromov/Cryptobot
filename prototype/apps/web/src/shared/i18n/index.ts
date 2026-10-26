import {
  createWebI18n,
  FALLBACK_LOCALE,
  intlLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
  matchLocale,
} from '@reinforce/i18n/web';
import { initReactI18next, useTranslation } from 'react-i18next';

export { isLocale, known, LOCALES, type Locale } from '@reinforce/i18n/web';
export { Trans, useTranslation as useT } from 'react-i18next';

const cookieChoice = (): Locale | null => {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(value) ? value : null;
};

export const i18n = createWebI18n(
  cookieChoice() ?? matchLocale(globalThis.navigator?.languages ?? []) ?? FALLBACK_LOCALE,
  [initReactI18next],
);

const markDocument = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = i18n.language;
  document.title = i18n.t('common:title');
};
markDocument();
i18n.on('languageChanged', markDocument);

const asLocale = (language: string): Locale => (isLocale(language) ? language : FALLBACK_LOCALE);

export const useLocale = (): Locale => asLocale(useTranslation().i18n.language);

export const useIntlLocale = (): string => intlLocale(useLocale());

const YEAR_MS = 365 * 86_400_000;

export async function chooseLocale(next: Locale): Promise<void> {
  await cookieStore.set({
    name: LOCALE_COOKIE,
    value: next,
    path: '/',
    expires: Date.now() + YEAR_MS,
    sameSite: 'lax',
  });
  await i18n.changeLanguage(next);
}

export function followServerLocale(server: Locale): void {
  if (!cookieChoice() && server !== asLocale(i18n.language)) void i18n.changeLanguage(server);
}
