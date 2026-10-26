/** The words for a code from the other side, when the catalog has them; a new code is not an error. */
export const known = <K extends string>(words: Record<K, string>, code: string): string | null =>
  Object.hasOwn(words, code) ? words[code as K] : null;
