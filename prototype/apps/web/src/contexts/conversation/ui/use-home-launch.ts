import { accepted } from '~/shared/api/rejection';
import { GENERAL_TOPIC } from '~/shared/routing/topics';
import { useLaunch } from '../api/launch';
import { useSendMessage } from '../api/mutations';
import type { Intent } from '../domain/composer';

export type HomeLaunch = {
  readonly say: (intent: Intent) => Promise<void>;
  readonly ask: (text: string) => void;
};

/** What home asks for goes to the coordinator, whose conversation opens at once, where the answer is awaited. */
export function useHomeLaunch(): HomeLaunch {
  const send = useSendMessage();
  const launch = useLaunch();

  const toCoordinator = (requestId: string, text: string) =>
    launch({
      topic: GENERAL_TOPIC,
      requestId,
      text,
      wait: 'converse',
      request: async () =>
        accepted(
          await send.mutateAsync({ topic: GENERAL_TOPIC, text, requestId, reviseProposalVersionId: null }),
        ).entry.id,
    });

  return {
    say: (intent) => toCoordinator(intent.requestId, intent.text),
    ask: (text) => {
      void toCoordinator(crypto.randomUUID(), text).catch(() => undefined);
    },
  };
}
