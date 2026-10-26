import { describe, expect, it } from 'vitest';
import { acceptedLanguages, LOCALES, type Locale, matchLocale, signedUsd } from '../src/index.js';
import { translator } from '../src/server.js';
import { serverCatalog } from '../src/server-catalog.js';
import { webCatalog } from '../src/web-catalog.js';

const SUFFIX = /_(zero|one|two|few|many|other)$/;
type Leaf = { key: string; value: string };

const leaves = (node: unknown, prefix = ''): Leaf[] =>
  typeof node === 'string'
    ? [{ key: prefix, value: node }]
    : Array.isArray(node)
      ? node.flatMap((x, i) => leaves(x, `${prefix}[${i}]`))
      : Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
          leaves(v, prefix ? `${prefix}.${k}` : k),
        );

/** A catalog as the words it gives: plural forms of one key count as one, with the forms it has. */
function words(catalog: Record<string, unknown>) {
  const out = new Map<string, { forms: Set<string>; values: string[] }>();
  for (const { key, value } of leaves(catalog)) {
    const form = SUFFIX.exec(key)?.[1];
    const base = form ? key.replace(SUFFIX, '') : key;
    const entry = out.get(base) ?? { forms: new Set<string>(), values: [] };
    if (form) entry.forms.add(form);
    entry.values.push(value);
    out.set(base, entry);
  }
  return out;
}
const params = (values: string[]) =>
  [...new Set(values.flatMap((v) => [...v.matchAll(/\{\{\s*(\w+)/g)].map((m) => m[1])))].sort();
const tags = (values: string[]) =>
  [...new Set(values.flatMap((v) => [...v.matchAll(/<\/?(\w+)>/g)].map((m) => m[0])))].sort();

describe.each([
  ['web', webCatalog],
  ['server', serverCatalog],
] as const)('the %s catalog', (_, catalog) => {
  const source = words(catalog.ru);
  it.each(LOCALES.filter((l) => l !== 'ru'))('%s says everything Russian says, with the same values', (l) => {
    const target = words(catalog[l]);
    expect([...target.keys()].sort()).toEqual([...source.keys()].sort());
    for (const [key, ru] of source) {
      const other = target.get(key)!;
      expect({ key, params: params(other.values) }).toEqual({ key, params: params(ru.values) });
      expect({ key, tags: tags(other.values) }).toEqual({ key, tags: tags(ru.values) });
    }
  });
  it.each(LOCALES)('%s has every plural form its language needs, and nothing empty', (l: Locale) => {
    const needed = new Intl.PluralRules(l).resolvedOptions().pluralCategories;
    for (const [key, entry] of words(catalog[l])) {
      expect({ key, empty: entry.values.some((v) => !v.trim()) }).toEqual({ key, empty: false });
      if (entry.forms.size)
        expect({ key, forms: [...entry.forms].sort() }).toEqual({ key, forms: [...needed].sort() });
    }
  });
});

describe('a language', () => {
  it('is taken from the first supported preference', () => {
    expect(matchLocale(['de-DE', 'en-GB', 'ru'])).toBe('en');
    expect(matchLocale(['ru-RU'])).toBe('ru');
    expect(matchLocale(['uk', 'de'])).toBeNull();
    expect(matchLocale([])).toBeNull();
  });
  it('is read from Accept-Language by weight, then by order', () => {
    expect(acceptedLanguages('de;q=0.9, ru-RU, en;q=0.8, *;q=0.1')).toEqual(['ru-RU', 'de', 'en']);
    expect(acceptedLanguages('en;q=0, ru')).toEqual(['ru']);
    expect(acceptedLanguages(undefined)).toEqual([]);
  });
  it('writes the server words and money in its own way', () => {
    expect(translator('ru')('chat.versionOn', { n: '2' })).toBe('Включена версия брокера 2.');
    expect(translator('en')('chat.versionOn', { n: '2' })).toBe('Broker version 2 is on.');
    expect(signedUsd(-1234.5, 'en')).toBe('−$1,234.50');
    expect(signedUsd(1234.5, 'ru')).toBe('+$1 234,50');
  });
});
