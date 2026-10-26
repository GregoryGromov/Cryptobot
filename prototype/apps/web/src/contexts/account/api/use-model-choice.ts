import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '~/shared/api/trpc';

export function useModelChoice() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries(trpc.views.session.pathFilter());
  const choose = useMutation(trpc.account.model.choose.mutationOptions({ onSuccess: refresh }));
  const disconnect = useMutation(trpc.account.model.disconnect.mutationOptions({ onSuccess: refresh }));
  return {
    busy: choose.isPending || disconnect.isPending,
    choose: (route: 'own' | 'free') => choose.mutate({ route }),
    disconnect: () => disconnect.mutate(),
  };
}
