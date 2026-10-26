import type { Chat, ChatItem } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import type { Pending, WaitKind } from './chat-types';

/**
 * What a person has asked for and the conversation does not show yet. `entry` is what the server answered the
 * request with: the words' entry, or the dispatch of an analysis, whose run and forecast carry it.
 */
export type Said = {
  readonly requestId: string;
  readonly text: string | null;
  readonly wait: WaitKind;
  readonly at: number;
  readonly entry: string | null;
  /** Why the server would not take the request: it stays in the conversation, said where the answer would be. */
  readonly refused: string | null;
};

export type OutboxEvent =
  | { readonly type: 'said'; readonly said: Said }
  | { readonly type: 'accepted'; readonly requestId: string; readonly entry: string | null }
  | { readonly type: 'refused'; readonly requestId: string; readonly reason: string }
  | { readonly type: 'failed'; readonly requestId: string };

export const outboxReducer = (state: readonly Said[], event: OutboxEvent): readonly Said[] =>
  match(event)
    .with({ type: 'said' }, ({ said }) => [
      ...state.filter((other) => other.requestId !== said.requestId && other.refused === null),
      said,
    ])
    .with({ type: 'accepted' }, ({ requestId, entry }) =>
      state.map((said) => (said.requestId === requestId ? { ...said, entry } : said)),
    )
    .with({ type: 'refused' }, ({ requestId, reason }) =>
      state.map((said) => (said.requestId === requestId ? { ...said, refused: reason } : said)),
    )
    .with({ type: 'failed' }, ({ requestId }) => state.filter((said) => said.requestId !== requestId))
    .exhaustive();

export const saidAt = (
  intent: { readonly requestId: string; readonly text: string | null; readonly wait: WaitKind },
  at: number,
): Said => ({ ...intent, at, entry: null, refused: null });

export type Echoes = {
  /** What was said and is not shown by the server: still waiting, or refused. */
  readonly unshown: readonly Said[];
  readonly waiting: readonly Said[];
  /** The keys of what the conversation shows for words already echoed; they are in place and do not enter again. */
  readonly landed: ReadonlySet<string>;
  /** When each run the server shows for an echo was asked for, which is earlier than the server took it up. */
  readonly askedAt: ReadonlyMap<string, number>;
};

const carries = (item: ChatItem, entry: string): boolean =>
  item.key === entry || (item.kind === 'message' && item.forecast?.threadId === entry);

/** The key the conversation shows an echo under: the person's words by their request, or what the server named. */
const arrivalOf = (said: Said, chat: Pick<Chat, 'items' | 'pending'>): string | null => {
  const words = chat.items.find((item) => item.kind === 'message' && item.requestId === said.requestId);
  if (words) return words.key;
  const { entry } = said;
  if (entry === null) return null;
  return (
    chat.pending.find((run) => run.id === entry)?.id ??
    chat.items.find((item) => carries(item, entry))?.key ??
    null
  );
};

export const echoesOf = (chat: Pick<Chat, 'items' | 'pending'>, outbox: readonly Said[]): Echoes => {
  const landed = new Set<string>();
  const askedAt = new Map<string, number>();
  const unshown = outbox.filter((said) => {
    const arrived = said.refused === null ? arrivalOf(said, chat) : null;
    if (arrived === null) return true;
    landed.add(arrived);
    if (said.entry !== null) askedAt.set(said.entry, said.at);
    return false;
  });
  return { unshown, waiting: unshown.filter((said) => said.refused === null), landed, askedAt };
};

/** The runs to wait on: the server's once it shows any, timed from when they were asked for. */
export const waitsOf = (
  pending: readonly Pending[],
  waiting: readonly Said[],
  askedAt: ReadonlyMap<string, number> = new Map(),
): readonly Pending[] =>
  pending.length
    ? pending.map((run) => {
        const asked = askedAt.get(run.id);
        return asked !== undefined && asked < run.since ? { ...run, since: asked } : run;
      })
    : waiting.map((said) => ({
        id: said.requestId,
        kind: said.wait,
        t0: null,
        deadline: null,
        since: said.at,
        attempt: 1,
      }));
