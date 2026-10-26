import type { Chat } from '@reinforce/server/dto';
import { isBrokerMessage } from './chat-types';

export type Draft = {
  readonly runId: string;
  readonly sourceId: string;
  readonly text: string;
  /** The conversation's seq when the server stopped showing the draft; null while the broker writes. */
  readonly stoppedAt: number | null;
};

export type StreamView =
  | { readonly kind: 'none' }
  | { readonly kind: 'writing'; readonly runId: string; readonly text: string; readonly waitId: string }
  | {
      readonly kind: 'finishing';
      readonly runId: string;
      readonly text: string;
      readonly key: string;
      readonly at: number;
    };

const NONE: StreamView = { kind: 'none' };

export const streamView = (
  chat: Pick<Chat, 'items' | 'pending' | 'seq'>,
  draft: Draft | null,
  laid: string | null,
): StreamView => {
  if (draft === null || !draft.text.trim()) return NONE;
  const run = chat.pending.find(
    (pending) => pending.kind === 'converse' && (pending.id === draft.runId || pending.id === draft.sourceId),
  );
  if (run) return { kind: 'writing', runId: draft.runId, text: draft.text, waitId: run.id };
  const last = chat.items.at(-1);
  if (laid !== draft.runId && isBrokerMessage(last) && last.text.startsWith(draft.text.trimEnd()))
    return { kind: 'finishing', runId: draft.runId, text: last.text, key: last.key, at: last.at };
  // The run ends before its answer is saved: the words stay until the conversation is read with what came of it.
  const failed = chat.items.some((item) => item.kind === 'failed' && item.runId === draft.runId);
  if (laid !== draft.runId && !failed && (draft.stoppedAt === null || chat.seq <= draft.stoppedAt))
    return { kind: 'writing', runId: draft.runId, text: draft.text, waitId: draft.sourceId };
  return NONE;
};

const WORD_PACE_MS = 42;
const WORD_CATCH_UP_MS = 280;
export const WORD_SETTLE_MS = 300;
export const WORD_IN_MS = 360;

export const wordStepMs = (backlog: number): number =>
  1 / Math.max(1 / WORD_PACE_MS, backlog / WORD_CATCH_UP_MS);
