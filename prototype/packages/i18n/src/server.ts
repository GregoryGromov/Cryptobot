import i18next from 'i18next';
import type {} from './i18next.js';
import { FALLBACK_LOCALE, type Locale } from './locale.js';
import { options } from './options.js';
import { serverCatalog } from './server-catalog.js';

export * from './known.js';
export * from './locale.js';

const instance = i18next.createInstance();
void instance.init({
  ...options,
  resources: serverCatalog,
  lng: FALLBACK_LOCALE,
  ns: ['server'],
  defaultNS: 'server',
});

/** The server's words in one language: a request's, or the stored one of a person reached outside a request. */
export const translator = (locale: Locale) => instance.getFixedT(locale, 'server');
export type Translate = ReturnType<typeof translator>;
