import type { serverCatalog } from './server-catalog.js';
import type { webCatalog } from './web-catalog.js';

/** Russian is the source language: keys and interpolation values are checked against it. */
type Resources = (typeof webCatalog)['ru'] & (typeof serverCatalog)['ru'];

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
  }
}
