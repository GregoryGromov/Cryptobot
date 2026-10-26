import type { SignalRow } from '@reinforce/server/dto';
import { useMutation } from '@tanstack/react-query';
import { useLaunch } from '~/contexts/conversation/api/launch';
import { useGoToTopic } from '~/contexts/conversation/api/navigation';
import { accepted, isRejected } from '~/shared/api/rejection';
import { trpc, trpcClient } from '~/shared/api/trpc';

function useAnalyzeSignal() {
  return useMutation({
    mutationKey: trpc.market.analyze.mutationKey(),
    meta: { silent: true },
    mutationFn: async ({
      signal,
      requestId,
    }: {
      readonly signal: SignalRow;
      readonly requestId: string;
    }): Promise<string | null> => {
      const result = await trpcClient.market.analyze.mutate({
        requestId,
        instrument: signal.coin,
        text: '',
        eventId: signal.eventId,
      });
      if (isRejected(result) && result.reason === 'already-asked') return null;
      return accepted(result).dispatch.id;
    },
  });
}

/** Opens a signal's conversation at once; one not read yet is asked about there. */
export function useOpenSignal(): (signal: SignalRow) => void {
  const go = useGoToTopic();
  const launch = useLaunch();
  const analyze = useAnalyzeSignal();
  return (signal) => {
    if (signal.asked) {
      void go(signal.chat, { idea: signal.threadId });
      return;
    }
    const requestId = crypto.randomUUID();
    void launch({
      topic: signal.chat,
      requestId,
      text: null,
      wait: 'forecast',
      idea: true,
      request: () => analyze.mutateAsync({ signal, requestId }),
    }).catch(() => undefined);
  };
}
