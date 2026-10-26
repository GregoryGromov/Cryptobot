import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { errorText } from '~/shared/api/error-map';
import { accepted, RejectedError } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';

const refreshTradeViews = (queryClient: QueryClient, topic: string): void => {
  for (const filter of [
    trpc.views.chat.queryFilter({ topic }),
    trpc.views.chats.pathFilter(),
    trpc.views.portfolio.pathFilter(),
    trpc.views.session.pathFilter(),
  ])
    void queryClient.invalidateQueries(filter);
};

export const failureText = (error: unknown): string =>
  error instanceof RejectedError ? error.message : errorText(error);

export const useConfirmProposal = (topic: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.trading.confirm.mutationOptions({
      meta: { silent: true },
      onSuccess: (result) => {
        accepted(result);
        refreshTradeViews(queryClient, topic);
      },
      onError: () => refreshTradeViews(queryClient, topic),
    }),
  );
};

export const useReviseProposal = (topic: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.conversation.send.mutationOptions({
      meta: { silent: true },
      onSuccess: (result) => {
        accepted(result);
        void queryClient.invalidateQueries(trpc.views.chat.queryFilter({ topic }));
        void queryClient.invalidateQueries(trpc.views.chats.pathFilter());
      },
    }),
  );
};

export const useManualTrade = (topic: string, onOrdered: () => void) => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.trading.manual.mutationOptions({
      meta: { silent: true },
      onSuccess: (result) => {
        accepted(result);
        refreshTradeViews(queryClient, topic);
        onOrdered();
      },
    }),
  );
};
