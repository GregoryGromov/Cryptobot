import type { Chat } from '@reinforce/server/dto';
import type { Dispatch } from 'react';
import { flushSync } from 'react-dom';
import { match } from 'ts-pattern';
import type { Span } from '~/contexts/markets/domain/chart-vm';
import { browserTimeZone } from '~/contexts/settings/domain/quiet-hours';
import { useServerSkew } from '~/shared/api/live';
import { accepted, RejectedError } from '~/shared/api/rejection';
import { refusalText, useLaunch } from '../api/launch';
import { useAnalyzeMarket, useRefreshChat, useSendMessage } from '../api/mutations';
import type { Asset, WaitKind } from '../domain/chat-types';
import { topicRoute } from '../domain/composer';
import { type OutboxEvent, saidAt } from '../domain/outbox';
import type { ThreadScroller } from './thread-scroller';

const UNREADABLE: ReadonlySet<string> = new Set(['market-closed', 'market-thin', 'market-unavailable']);

export type SayIntent = {
  readonly requestId: string;
  readonly text: string;
  readonly asset: Asset | null;
  readonly analyze: boolean;
  /** A stretch of the market's chart the words are about; such words always go to the broker as words. */
  readonly span?: Span | null;
};

export function useConversationSay(
  chat: Chat,
  outbox: Dispatch<OutboxEvent>,
  scroller: ThreadScroller,
): (intent: SayIntent) => Promise<void> {
  const send = useSendMessage();
  const analyze = useAnalyzeMarket();
  const launch = useLaunch();
  const refresh = useRefreshChat();
  const skew = useServerSkew();

  const echo = (requestId: string, text: string | null, wait: WaitKind) => {
    scroller.brace();
    flushSync(() => outbox({ type: 'said', said: saidAt({ requestId, text, wait }, Date.now() + skew) }));
    scroller.turn();
  };

  const sendWords = async (requestId: string, text: string, span: Span | null = null) =>
    accepted(
      await send.mutateAsync({
        topic: chat.key,
        text,
        requestId,
        reviseProposalVersionId: null,
        span,
        timeZone: browserTimeZone(),
      }),
    ).entry.id;

  const settle = async (requestId: string, request: () => Promise<string | null>) => {
    try {
      const entry = await request();
      outbox({ type: 'accepted', requestId, entry });
    } catch (error) {
      outbox({ type: 'failed', requestId });
      throw error;
    }
    await refresh(chat.key);
  };

  return async ({ requestId, text, asset, analyze: wantsAnalysis, span = null }) => {
    if (span && text) {
      echo(requestId, text, 'converse');
      return settle(requestId, () => sendWords(requestId, text, span));
    }
    const analyzeFirst = wantsAnalysis || (chat.market !== null && chat.latestThread === null);
    await match(topicRoute(chat.key, analyzeFirst, asset))
      .with({ kind: 'analyze', here: false }, ({ instrument }) =>
        launch({
          topic: instrument,
          requestId,
          text: text || null,
          wait: 'forecast',
          request: async () =>
            accepted(await analyze.mutateAsync({ requestId, instrument, text })).dispatch.id,
        }),
      )
      .with({ kind: 'analyze', here: true }, async ({ instrument }) => {
        echo(requestId, text || null, 'forecast');
        try {
          const { dispatch } = accepted(await analyze.mutateAsync({ requestId, instrument, text }));
          outbox({ type: 'accepted', requestId, entry: dispatch.id });
        } catch (error) {
          // A market too quiet to analyse can still be talked about: the question goes to the broker as words.
          if (text && error instanceof RejectedError && UNREADABLE.has(error.reason)) {
            outbox({ type: 'said', said: saidAt({ requestId, text, wait: 'converse' }, Date.now() + skew) });
            return settle(requestId, () => sendWords(requestId, text));
          }
          outbox({ type: 'refused', requestId, reason: refusalText(error) });
          return;
        }
        await refresh(chat.key);
      })
      .with({ kind: 'send' }, () => {
        echo(requestId, text, 'converse');
        return settle(requestId, () => sendWords(requestId, text));
      })
      .exhaustive();
  };
}
