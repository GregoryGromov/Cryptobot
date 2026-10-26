import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changedBy, watchIn } from '~/contexts/markets/domain/market-list-vm';
import { PREFERENCES_SCOPE } from '~/shared/api/preferences-scope';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';

export const useWatchMarkets = () => {
  const queryClient = useQueryClient();
  const catalogKey = trpc.views.catalog.queryKey();
  const mutation = useMutation(
    trpc.broker.preferences.mutationOptions({
      scope: PREFERENCES_SCOPE,
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: catalogKey });
        const before = queryClient.getQueryData(catalogKey);
        if (before && input.kind === 'watch')
          queryClient.setQueryData(catalogKey, watchIn(before, input.markets, input.on));
        return { before };
      },
      onSuccess: (result) => {
        accepted(result);
      },
      onError: (_error, input, context) => {
        const current = queryClient.getQueryData(catalogKey);
        if (!current || !context?.before || input.kind !== 'watch') return;
        queryClient.setQueryData(
          catalogKey,
          watchIn(current, changedBy(context.before, input.markets, input.on), !input.on),
        );
      },
      onSettled: () => {
        void queryClient.invalidateQueries(trpc.views.catalog.pathFilter());
        void queryClient.invalidateQueries(trpc.views.session.pathFilter());
      },
    }),
  );
  return (markets: readonly string[], on: boolean) =>
    mutation.mutate({ kind: 'watch', markets: [...markets], on });
};
