import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';

const rejectRejected = (result: unknown): void => {
  accepted(result);
};

export const useSendMessage = () =>
  useMutation(trpc.conversation.send.mutationOptions({ onSuccess: rejectRejected }));

// A refused analysis is said in its conversation, where the answer would have come, not in a toast.
export const useAnalyzeMarket = () =>
  useMutation(trpc.market.analyze.mutationOptions({ onSuccess: rejectRejected, meta: { silent: true } }));

export const useStartTalk = () =>
  useMutation(trpc.conversation.start.mutationOptions({ onSuccess: rejectRejected }));

export const useRetryRun = () => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.runtime.retry.mutationOptions({
      onSuccess: (result) => {
        accepted(result);
        void queryClient.invalidateQueries(trpc.views.chat.pathFilter());
      },
    }),
  );
};

export const useWatchMarkets = () => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.broker.preferences.mutationOptions({
      onSuccess: (result) => {
        accepted(result);
        void queryClient.invalidateQueries(trpc.views.session.pathFilter());
        void queryClient.invalidateQueries(trpc.views.chats.pathFilter());
        void queryClient.invalidateQueries(trpc.views.chat.pathFilter());
      },
    }),
  );
};

export function useRefreshChat(): (topic: string) => Promise<void> {
  const queryClient = useQueryClient();
  return (topic) => queryClient.invalidateQueries(trpc.views.chat.queryFilter({ topic }));
}
