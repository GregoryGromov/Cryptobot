import type { InitOptions } from 'i18next';
import { FALLBACK_LOCALE, LOCALES } from './locale.js';

/** Catalogs ship with the code, so an instance is ready as soon as it is created. */
export const options = {
  fallbackLng: FALLBACK_LOCALE,
  supportedLngs: LOCALES,
  interpolation: { escapeValue: false },
  initAsync: false,
} satisfies InitOptions;
