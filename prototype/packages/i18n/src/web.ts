import i18next, { type i18n, type Module } from 'i18next';
import type {} from './i18next.js';
import type { Locale } from './locale.js';
import { options } from './options.js';
import { webCatalog } from './web-catalog.js';

export * from './known.js';
export * from './locale.js';

export function createWebI18n(lng: Locale, plugins: Module[] = []): i18n {
  const instance = i18next.createInstance();
  for (const plugin of plugins) instance.use(plugin);
  void instance.init({
    ...options,
    resources: webCatalog,
    lng,
    ns: Object.keys(webCatalog.ru),
    defaultNS: 'common',
  });
  return instance;
}
