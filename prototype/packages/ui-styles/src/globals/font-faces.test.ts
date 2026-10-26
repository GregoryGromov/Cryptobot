import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

type Face = {
  readonly family: string;
  readonly descriptors: string;
  readonly src: string;
  readonly ranges: readonly string[];
};

const FULL_RANGE = ['U+0-10FFFF'];

const facesOf = (css: string): Face[] =>
  [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body = '']) => {
    const read = (name: string) =>
      body
        .match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]
        ?.replace(/\s+/g, ' ')
        .trim();
    return {
      family: read('font-family') ?? '',
      descriptors: [read('font-weight'), read('font-stretch'), read('font-style')].join(' / '),
      src: read('src') ?? '',
      ranges: read('unicode-range')?.split(/\s*,\s*/) ?? FULL_RANGE,
    };
  });

const SCRIPT_SAMPLES = {
  latin: 'a',
  cyrillic: 'ж',
};

const unquote = (family: string) => family.trim().replaceAll('"', '');

const familiesBeforeFallback = (css: string, stack: string) => {
  const families = (css.match(new RegExp(`${stack}:([^;]+);`))?.[1] ?? '').split(',').map(unquote);
  return families.slice(
    0,
    families.findIndex((family) => family.endsWith('Fallback')),
  );
};

const covers = (range: string, codePoint: number) => {
  const [start = '', end = start] = range.replace(/^U\+/i, '').split('-');
  return codePoint >= Number.parseInt(start, 16) && codePoint <= Number.parseInt(end, 16);
};

const sharedFaces = async () => {
  const sheets = await Promise.all(
    ['./index.css', './font-fallbacks.generated.css'].map((sheet) =>
      readFile(new URL(sheet, import.meta.url), 'utf8'),
    ),
  );
  return sheets.flatMap(facesOf);
};

describe('shared @font-face set', () => {
  it('covers the same characters in every weight and width group of a family', async () => {
    const coverage = new Map<string, Map<string, Set<string>>>();
    for (const face of await sharedFaces()) {
      const groups = coverage.get(face.family) ?? new Map<string, Set<string>>();
      const ranges = groups.get(face.descriptors) ?? new Set<string>();
      for (const range of face.ranges) ranges.add(range);
      groups.set(face.descriptors, ranges);
      coverage.set(face.family, groups);
    }

    const uneven = [...coverage]
      .filter(([, groups]) => new Set([...groups.values()].map((r) => [...r].sort().join())).size > 1)
      .map(([family]) => family);

    expect(uneven).toEqual([]);
  });

  it('reaches a self-hosted face for every script in both stacks before the metric fallback', async () => {
    const css = await readFile(new URL('./index.css', import.meta.url), 'utf8');
    const faces = facesOf(css);

    const gaps = ['--font-sans', '--font-mono'].flatMap((stack) => {
      const families = familiesBeforeFallback(css, stack);
      return Object.entries(SCRIPT_SAMPLES)
        .filter(
          ([, sample]) =>
            !faces.some(
              (face) =>
                families.includes(unquote(face.family)) &&
                face.ranges.some((range) => covers(range, sample.codePointAt(0) ?? 0)),
            ),
        )
        .map(([script]) => `${stack} ${script}`);
    });

    expect(gaps).toEqual([]);
  });

  it('references exactly the vendored font files', async () => {
    const referenced = (await sharedFaces()).flatMap((face) =>
      [...face.src.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map(([, file]) => file),
    );

    const vendored = await readdir(new URL('../fonts/', import.meta.url));

    expect(new Set(referenced)).toEqual(new Set(vendored.filter((file) => file.endsWith('.woff2'))));
  });
});
