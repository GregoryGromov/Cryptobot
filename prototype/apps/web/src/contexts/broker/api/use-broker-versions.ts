import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';

const useRefreshBroker = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries(trpc.views.broker.pathFilter()),
      queryClient.invalidateQueries(trpc.views.session.pathFilter()),
    ]);
};

export const useSaveVersion = () => {
  const refresh = useRefreshBroker();
  return useMutation(
    trpc.broker.saveVersion.mutationOptions({
      meta: { silent: true },
      onSuccess: async (result) => {
        accepted(result);
        await refresh();
      },
      onError: () => refresh(),
    }),
  );
};

export const useActivateVersion = () => {
  const refresh = useRefreshBroker();
  const intents = useRef(new Map<string, string>());
  const mutation = useMutation(
    trpc.broker.activate.mutationOptions({
      onSuccess: (result) => {
        accepted(result);
      },
      onSettled: () => refresh(),
    }),
  );
  const activate = (versionId: string, baseVersionId: string) => {
    const intent = `${versionId}:${baseVersionId}`;
    const requestId = intents.current.get(intent) ?? crypto.randomUUID();
    intents.current.set(intent, requestId);
    mutation.mutate(
      { versionId, baseVersionId, requestId },
      { onSuccess: () => intents.current.delete(intent) },
    );
  };
  return { activate, activating: mutation.isPending ? mutation.variables.versionId : null };
};
