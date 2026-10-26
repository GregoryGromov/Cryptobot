import {
  acceptedLanguages,
  FALLBACK_LOCALE,
  isLocale,
  type Locale,
  matchLocale,
} from '@reinforce/i18n/server';
import type { User } from '../modules/account/index.js';

/** A choice made on the device, then the account's language, then the browser's. */
export const requestLocale = (
  cookie: string | undefined,
  user: User | undefined,
  acceptLanguage: string | undefined,
): Locale =>
  isLocale(cookie)
    ? cookie
    : (user?.locale ?? matchLocale(acceptedLanguages(acceptLanguage)) ?? FALLBACK_LOCALE);
