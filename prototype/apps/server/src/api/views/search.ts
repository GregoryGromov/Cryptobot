import * as conversation from '../../modules/conversation/index.js';
import type { Deps } from '../../workflows/deps.js';
import type { SearchHit } from '../view-types.js';

const HITS = 20;
/** How much of a message is shown around the words found: a little before them, the rest after. */
const BEFORE = 32;
const LENGTH = 140;

/** A message cut to the words found in it: one line, with the place of the words in it. */
export function snippetOf(text: string, needle: string): Pick<SearchHit, 'text' | 'start' | 'length'> {
  const line = text.replace(/\s+/g, ' ').trim();
  const at = line.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return { text: line.slice(0, LENGTH), start: 0, length: 0 };
  const from = at <= BEFORE ? 0 : at - BEFORE;
  const cut = line.slice(from, from + LENGTH);
  const head = from > 0 ? '…' : '';
  const tail = from + LENGTH < line.length ? '…' : '';
  return { text: `${head}${cut}${tail}`, start: head.length + at - from, length: needle.length };
}

/** What was said in the user's conversations with the words asked for, the latest first. */
export async function searchView(
  deps: Deps,
  userId: string | undefined,
  query: string,
): Promise<SearchHit[]> {
  const needle = query.trim();
  if (!userId || !needle) return [];
  const rows = await conversation.searchEntries(deps.db, userId, needle, HITS);
  return rows.map((row) => {
    const role = row.kind === 'user-message' || row.kind === 'analysis-request' ? 'user' : 'broker';
    const text = role === 'user' ? conversation.withoutAssetCode(row.text, row.topic) : row.text;
    return { id: row.id, topic: row.topic, at: row.createdAt, role, ...snippetOf(text, needle) };
  });
}
