import type { Chat } from '@reinforce/server/dto';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { errorText } from '~/shared/api/error-map';
import { useServerSkew } from '~/shared/api/live';
import { RejectedError } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';
import { topicKind, topicLink } from '~/shared/routing/topics';
import type { WaitKind } from '../domain/chat-types';
import { saidAt } from '../domain/outbox';
import { talkTitle } from '../domain/prompts';
import { useGoToTopic } from './navigation';
import { tellOutbox } from './outbox-store';

export type Launch = {
  readonly topic: string;
  readonly requestId: string;
  /** The person's words, shown at once; null when they asked without words. */
  readonly text: string | null;
  readonly wait: WaitKind;
  /** Asks the server; resolves to what it answered with: the words' entry or the analysis' dispatch. */
  readonly request: () => Promise<string | null>;
  /** The forecast the request brings opens in full when it comes, as an idea followed from a signal does. */
  readonly idea?: boolean;
};

export const refusalText = (error: unknown): string =>
  error instanceof RejectedError ? error.message : errorText(error);

// A talk is the server's only once its first words are; until then the page shows it begun, with nothing in it.
const begunTalk = (key: string, text: string | null): Chat => ({
  conversationId: null,
  seq: 0,
  key,
  title: talkTitle(text ?? ''),
  market: null,
  items: [],
  pending: [],
  model: true,
  needsLogin: false,
  unread: 0,
  firstUnread: null,
  position: null,
  ticket: null,
  latestThread: null,
  live: null,
  record: null,
});

/**
 * Opens the conversation a request belongs to at once, with the request already waiting in it, and only then asks
 * the server. Reading the market for an analysis takes seconds; the person spends them where the answer will come.
 */
export function useLaunch(): (launch: Launch) => Promise<void> {
  const queryClient = useQueryClient();
  const router = useRouter();
  const go = useGoToTopic();
  const skew = useServerSkew();
  const here = (topic: string) =>
    router.state.location.pathname === router.buildLocation(topicLink(topic)).pathname;
  return async ({ topic, requestId, text, wait, request, idea = false }) => {
    const talk = topicKind(topic).kind === 'talk';
    const chat = trpc.views.chat.queryKey({ topic });
    tellOutbox(topic, { type: 'said', said: saidAt({ requestId, text, wait }, Date.now() + skew) });
    if (talk && queryClient.getQueryData(chat) === undefined)
      queryClient.setQueryData(chat, begunTalk(topic, text));
    void go(topic);
    let entry: string | null;
    try {
      entry = await request();
    } catch (error) {
      // A talk that never began has nothing to show: the person is taken back to where they asked.
      if (talk) {
        tellOutbox(topic, { type: 'failed', requestId });
        if (here(topic)) await router.navigate({ to: '/', replace: true });
        queryClient.removeQueries({ queryKey: chat, exact: true });
        throw error;
      }
      tellOutbox(topic, { type: 'refused', requestId, reason: refusalText(error) });
      return;
    }
    tellOutbox(topic, { type: 'accepted', requestId, entry });
    if (idea && entry !== null && here(topic))
      void router.navigate({
        to: '/m/$market',
        params: { market: topic },
        search: { idea: entry },
        replace: true,
        resetScroll: false,
      });
    await queryClient.invalidateQueries(trpc.views.chat.queryFilter({ topic }));
  };
}
