import type { Chat, ChatItem, ChatMessage } from '@reinforce/server/dto';
import { match, P } from 'ts-pattern';
import { startOfDay } from '~/shared/format/time';
import type { FailedItem } from './chat-types';
import { brokerText } from './prompts';

export type Who = 'user' | 'broker' | 'note';

export type FeedRow =
  | { readonly kind: 'day'; readonly key: string; readonly at: number }
  | { readonly kind: 'unread'; readonly key: string }
  | { readonly kind: 'live'; readonly key: string }
  | {
      readonly kind: 'entry';
      readonly key: string;
      readonly who: Who;
      readonly item: ChatItem;
      /** A forecast with the broker's words after it stands as two rows: the card, then the words. */
      readonly part: EntryPart;
      readonly failure: FailedItem | null;
      readonly follows: boolean;
    };

export type EntryPart = 'whole' | 'card' | 'words';

export const wordsKey = (key: string): string => `${key}:words`;

/** A forecast card shows the trade offered on it, so the offer is not repeated in the words after it. */
export const holdsDeal = (item: Pick<ChatMessage, 'forecast' | 'proposal'>): boolean =>
  item.forecast !== null && item.proposal !== null;

const hasWords = (item: ChatMessage): boolean =>
  brokerText(item) !== null ||
  (item.proposal !== null && !holdsDeal(item)) ||
  item.options !== null ||
  item.handoff !== null;

const partsOf = (item: ChatItem): readonly EntryPart[] =>
  item.kind === 'message' && item.role === 'broker' && item.forecast !== null && hasWords(item)
    ? ['card', 'words']
    : ['whole'];

export type FeedInput = {
  readonly items: readonly ChatItem[];
  readonly unreadFrom: string | null;
  readonly live: boolean;
  readonly hidden: string | null;
};

export const UNREAD_ANCHOR = 'conversation-unread';

const whoOf = (item: ChatItem): Who =>
  match(item)
    .with({ kind: 'message', role: 'user' }, (): Who => 'user')
    .with({ kind: 'message', role: 'broker' }, (): Who => 'broker')
    .with({ kind: 'message', role: 'system' }, (): Who => 'note')
    .with({ kind: 'mention' }, (): Who => 'broker')
    .with({ kind: P.union('signal', 'check', 'failed') }, (): Who => 'note')
    .exhaustive();

const foldedFailures = (items: readonly ChatItem[]): ReadonlyMap<string, FailedItem> => {
  const under = new Map<string, FailedItem>();
  items.forEach((item, index) => {
    const next = items[index + 1];
    if (item.kind === 'signal' && next?.kind === 'failed' && next.runKind === 'forecast')
      under.set(item.key, next);
  });
  return under;
};

export const feedRows = ({ items, unreadFrom, live, hidden }: FeedInput): readonly FeedRow[] => {
  const failures = foldedFailures(items);
  const folded = new Set([...failures.values()].map((failure) => failure.key));
  const rows: FeedRow[] = [];
  let day: number | null = null;
  let previous: Who | null = null;
  items.forEach((item, index) => {
    if (folded.has(item.key)) return;
    const leadsLive = live && index === 0;
    if (item.at > 0) {
      const today = startOfDay(item.at);
      if (today !== day && !leadsLive) {
        rows.push({ kind: 'day', key: `day-${today}`, at: item.at });
        previous = null;
      }
      day = today;
    }
    if (item.key === unreadFrom && index > 0) {
      rows.push({ kind: 'unread', key: UNREAD_ANCHOR });
      previous = null;
    }
    const who = whoOf(item);
    for (const part of partsOf(item)) {
      const key = part === 'words' ? wordsKey(item.key) : item.key;
      if (item.key === hidden && part !== 'card') continue;
      rows.push({
        kind: 'entry',
        key,
        who,
        item,
        part,
        failure: failures.get(item.key) ?? null,
        follows: previous === who,
      });
      previous = who;
    }
    if (leadsLive) {
      rows.push({ kind: 'live', key: 'live' });
      previous = null;
    }
  });
  if (live && items.length === 0) rows.push({ kind: 'live', key: 'live' });
  return rows;
};

export const opensDay = (items: readonly ChatItem[], at: number): boolean => {
  const last = items.findLast((item) => item.at > 0);
  return !last || startOfDay(last.at) !== startOfDay(at);
};

export const unreadAnchor = (chat: Pick<Chat, 'items' | 'pending' | 'firstUnread'>): string | null => {
  const index = chat.firstUnread ? chat.items.findIndex((item) => item.key === chat.firstUnread) : -1;
  const tail = chat.items.at(-1);
  const asked = chat.pending.length > 0 || (tail?.kind === 'message' && tail.role === 'user');
  return index > 0 && !asked ? chat.firstUnread : null;
};

export const linkedForecast = (items: readonly ChatItem[], idea: string | null): string | null => {
  if (idea === null) return null;
  const found = items.findLast(
    (item) => item.kind === 'message' && item.forecast !== null && item.forecast.threadId === idea,
  );
  return found?.kind === 'message' ? (found.forecast?.id ?? null) : null;
};

export const latestForecast = (items: readonly ChatItem[]): string | null => {
  const found = items.findLast((item) => item.kind === 'message' && item.forecast !== null);
  return found?.kind === 'message' ? (found.forecast?.id ?? null) : null;
};
