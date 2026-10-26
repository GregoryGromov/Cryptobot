export type Atom =
  | { readonly kind: 'word'; readonly text: string; readonly strong: boolean }
  | { readonly kind: 'ticker'; readonly ticker: string; readonly tail: string; readonly strong: boolean }
  | {
      readonly kind: 'move';
      readonly text: string;
      readonly direction: 'up' | 'down';
      readonly tail: string;
      readonly strong: boolean;
    };

export type WordBlock = { readonly kind: 'line' | 'point'; readonly atoms: readonly Atom[] };

/** A paragraph is a run of lines; a list, a run of points. */
export type WordGroup =
  | { readonly kind: 'paragraph'; readonly lines: readonly (readonly Atom[])[] }
  | { readonly kind: 'list'; readonly points: readonly (readonly Atom[])[] };

const POINT = /^\s*(?:[-•*–]|\d{1,2}[.)])\s+/;
const TOKEN =
  /(\*\*|\$(?:[a-z]{1,8}:)?[A-Za-z][A-Za-z0-9]{0,11}(?![A-Za-z0-9])|(?<![\p{L}\p{N}.,])[+\-−]\d+(?:[.,]\d+)?\s?%)/u;

const atomsOf = (line: string, strong: { on: boolean }): Atom[] => {
  const atoms: Atom[] = [];
  const words = (text: string) => {
    for (const word of text.split(/(?<=\s)/))
      if (word) atoms.push({ kind: 'word', text: word, strong: strong.on });
  };
  const parts = line.split(TOKEN);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index] ?? '';
    if (index % 2 === 0) {
      words(part);
      continue;
    }
    if (part === '**') {
      strong.on = !strong.on;
      continue;
    }
    // A token keeps the space after it, so the reveal steps word by word as with plain words.
    const next = parts[index + 1] ?? '';
    const tail = next.match(/^\s*/)?.[0] ?? '';
    parts[index + 1] = next.slice(tail.length);
    if (part.startsWith('$'))
      atoms.push({
        kind: 'ticker',
        ticker: part.slice(1).replace(/^.*:/, '').toUpperCase(),
        tail,
        strong: strong.on,
      });
    else
      atoms.push({
        kind: 'move',
        text: part.replace(/^-/, '−'),
        direction: part.startsWith('+') ? 'up' : 'down',
        tail,
        strong: strong.on,
      });
  }
  return atoms;
};

/** The broker's words as lines and points, each a run of atoms the reveal counts one by one. */
export const wordBlocks = (text: string): readonly WordBlock[] => {
  const strong = { on: false };
  const blocks: WordBlock[] = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) {
      strong.on = false;
      blocks.push({ kind: 'line', atoms: [] });
      continue;
    }
    const point = POINT.test(raw);
    blocks.push({ kind: point ? 'point' : 'line', atoms: atomsOf(raw.replace(POINT, '').trim(), strong) });
  }
  return blocks;
};

export const atomCount = (blocks: readonly WordBlock[]): number =>
  blocks.reduce((count, block) => count + block.atoms.length, 0);

/** The first `shown` atoms, grouped as they stand: an empty line closes a paragraph, a point joins a list. */
export const wordGroups = (
  blocks: readonly WordBlock[],
  shown = Number.POSITIVE_INFINITY,
): readonly WordGroup[] => {
  const groups: WordGroup[] = [];
  let left = shown;
  let open: { kind: 'paragraph'; lines: Atom[][] } | { kind: 'list'; points: Atom[][] } | null = null;
  for (const block of blocks) {
    if (left <= 0) break;
    if (block.atoms.length === 0) {
      open = null;
      continue;
    }
    const atoms = block.atoms.slice(0, left);
    left -= atoms.length;
    if (block.kind === 'point') {
      if (open?.kind !== 'list') {
        open = { kind: 'list', points: [] };
        groups.push(open);
      }
      open.points.push(atoms);
    } else {
      if (open?.kind !== 'paragraph') {
        open = { kind: 'paragraph', lines: [] };
        groups.push(open);
      }
      open.lines.push(atoms);
    }
  }
  return groups;
};

/** The words as plain text: what a preview line or a screen reader says. */
export const plainWords = (text: string): string =>
  text
    .replace(/\*\*/g, '')
    .replace(/\$(?:[a-z]{1,8}:)?([A-Za-z][A-Za-z0-9]{0,11})(?![A-Za-z0-9])/g, (_, ticker: string) =>
      ticker.toUpperCase(),
    )
    .replace(/^\s*[-•*–]\s+/gm, '• ');

/** How many atoms of words still being written can be shown: the last one waits until it is whole. */
export const readyAtoms = (text: string, settled: boolean): number => {
  const count = atomCount(wordBlocks(text));
  return settled || /\s$/.test(text) ? count : Math.max(0, count - 1);
};
