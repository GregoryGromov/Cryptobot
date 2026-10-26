import type { Chat } from '@reinforce/server/dto';
import { skipToken, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { trpc } from '~/shared/api/trpc';
import { type HeldAnalysis, heldAfter } from '../domain/analysis';
import type { Draft } from '../domain/stream';

/** What the broker is writing in the conversation while he writes it: an answer's words, an analysis's steps. */
export function useConversationStream(chat: Pick<Chat, 'conversationId' | 'seq' | 'key'>): {
  readonly draft: Draft | null;
  readonly analyses: readonly HeldAnalysis[];
} {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [analyses, setAnalyses] = useState<readonly HeldAnalysis[]>([]);
  const read = useRef(chat.seq);
  useEffect(() => {
    read.current = chat.seq;
  }, [chat.seq]);
  const id = chat.conversationId;
  useSubscription(
    trpc.conversation.events.subscriptionOptions(id ? { id, after: chat.seq } : skipToken, {
      onData: (event) =>
        match(event)
          .with({ kind: 'entries' }, () => {
            void queryClient.invalidateQueries(trpc.views.chat.queryFilter({ topic: chat.key }));
          })
          .with({ kind: 'draft' }, (next) => {
            const shown = next.draft;
            if (shown) setDraft({ ...shown, stoppedAt: null });
            else
              setDraft((current) => current && { ...current, stoppedAt: current.stoppedAt ?? read.current });
          })
          .with({ kind: 'analysis' }, (next) => {
            setAnalyses((current) => heldAfter(current, next.progress, read.current));
          })
          .exhaustive(),
    }),
  );
  return { draft, analyses };
}

export function useMarkRead(chat: Pick<Chat, 'conversationId' | 'seq' | 'unread' | 'key'>): void {
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    trpc.conversation.read.mutationOptions({
      meta: { silent: true },
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.views.chats.pathFilter());
        void queryClient.invalidateQueries(trpc.views.chat.queryFilter({ topic: chat.key }));
      },
    }),
  );
  const { conversationId: id, seq, unread } = chat;
  useEffect(() => {
    if (id && unread > 0) mutate({ id, seq });
  }, [id, seq, unread, mutate]);
}
