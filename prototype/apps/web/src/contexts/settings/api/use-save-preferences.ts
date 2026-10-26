import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyPatch, type PreferencesPatch, revertPatch } from '~/contexts/settings/domain/preferences-patch';
import { PREFERENCES_SCOPE } from '~/shared/api/preferences-scope';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';

export const useSavePreferences = () => {
  const queryClient = useQueryClient();
  const sessionKey = trpc.views.session.queryKey();
  const mutation = useMutation(
    trpc.broker.preferences.mutationOptions({
      scope: PREFERENCES_SCOPE,
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: sessionKey });
        const before = queryClient.getQueryData(sessionKey);
        if (before && input.kind === 'patch')
          queryClient.setQueryData(sessionKey, {
            ...before,
            preferences: applyPatch(before.preferences, input.patch),
          });
        return { before: before?.preferences };
      },
      onSuccess: (result) => {
        accepted(result);
      },
      onError: (_error, input, context) => {
        const current = queryClient.getQueryData(sessionKey);
        if (!current || !context?.before || input.kind !== 'patch') return;
        queryClient.setQueryData(sessionKey, {
          ...current,
          preferences: revertPatch(current.preferences, context.before, input.patch),
        });
      },
      onSettled: () => {
        if (queryClient.isMutating({ mutationKey: trpc.broker.preferences.mutationKey() }) === 1)
          void queryClient.invalidateQueries(trpc.views.session.pathFilter());
      },
    }),
  );
  return (patch: PreferencesPatch) => mutation.mutate({ kind: 'patch', patch });
};
