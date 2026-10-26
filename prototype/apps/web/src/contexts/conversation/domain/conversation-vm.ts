import type { Chat } from '@reinforce/server/dto';
import { topicKind } from '~/shared/routing/topics';
import { isBrokerMessage } from './chat-types';
import { type FeedRow, feedRows, opensDay, wordsKey } from './feed';
import { echoesOf, type Said, waitsOf } from './outbox';
import { type Hint, type HintWords, nextHints, offersHints } from './prompts';
import { type Draft, type StreamView, streamView } from './stream';
import { type WaitRow, waitRows } from './waiting';

export type Laid = { readonly runId: string; readonly key: string };

export type ConversationVmInput = {
  readonly chat: Chat;
  readonly outbox: readonly Said[];
  readonly draft: Draft | null;
  readonly laid: Laid | null;
  readonly unreadFrom: string | null;
  readonly opened: ReadonlySet<string>;
  readonly words: HintWords;
};

export type Announcement =
  | { readonly kind: 'none' }
  | { readonly kind: 'writing' }
  | { readonly kind: 'waiting'; readonly wait: WaitRow['run']['kind'] }
  | { readonly kind: 'answer'; readonly text: string };

export type ConversationVm = {
  readonly rows: readonly FeedRow[];
  readonly echoes: readonly Said[];
  readonly echoOpensDay: boolean;
  readonly waits: readonly WaitRow[];
  readonly stream: StreamView;
  /** The broker's wait and words come right under his own last row, as his next words there would. */
  readonly brokerFollows: boolean;
  readonly hints: readonly Hint[];
  readonly firstLook: boolean;
  readonly busy: boolean;
  readonly entering: (key: string) => 'still' | 'fresh' | 'landed';
  readonly announcement: Announcement;
};

const announce = (
  chat: Chat,
  stream: StreamView,
  waits: readonly WaitRow[],
  opened: ReadonlySet<string>,
): Announcement => {
  if (stream.kind === 'writing') return { kind: 'writing' };
  const lead = waits[0];
  if (lead) return { kind: 'waiting', wait: lead.run.kind };
  const last = chat.items.at(-1);
  if (stream.kind === 'none' && isBrokerMessage(last) && !opened.has(last.key))
    return { kind: 'answer', text: last.text };
  return { kind: 'none' };
};

export const conversationVm = ({
  chat,
  outbox,
  draft,
  laid,
  unreadFrom,
  opened,
  words,
}: ConversationVmInput): ConversationVm => {
  const stream = streamView(chat, draft, laid?.runId ?? null);
  const { unshown, waiting, landed, askedAt } = echoesOf(chat, outbox);
  const echoes = unshown.filter((said) => said.text !== null || said.refused !== null);
  const waits = waitRows(
    waitsOf(chat.pending, waiting, askedAt),
    stream.kind === 'writing' ? stream.waitId : null,
  );
  const busy = waits.length > 0 || waiting.length > 0 || stream.kind !== 'none';
  const general = topicKind(chat.key).kind === 'general';
  const firstEcho = echoes[0];
  const rows = feedRows({
    items: chat.items,
    unreadFrom,
    live: general && chat.live !== null,
    hidden: stream.kind === 'finishing' ? stream.key : null,
  });
  const lastRow = rows.at(-1);
  return {
    rows,
    echoes,
    echoOpensDay: firstEcho !== undefined && opensDay(chat.items, firstEcho.at),
    waits,
    stream,
    brokerFollows: echoes.length === 0 && lastRow?.kind === 'entry' && lastRow.who === 'broker',
    hints: offersHints(chat.items, busy) ? nextHints(chat, words) : [],
    firstLook: chat.market !== null && chat.items.length === 0 && !busy,
    busy,
    entering: (key) => {
      if (opened.has(key)) return 'still';
      const laidHere = laid !== null && (laid.key === key || wordsKey(laid.key) === key);
      return landed.has(key) || laidHere ? 'landed' : 'fresh';
    },
    announcement: announce(chat, stream, waits, opened),
  };
};
