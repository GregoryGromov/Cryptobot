import type { Locale } from '@reinforce/i18n/web';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';
import { chooseLocale } from '~/shared/i18n';

export const useTelegramLink = () => {
  const queryClient = useQueryClient();
  const link = useMutation(
    trpc.telegram.link.mutationOptions({
      onSuccess: (result) => {
        accepted(result);
      },
    }),
  );
  const unlink = useMutation(
    trpc.telegram.unlink.mutationOptions({
      onSettled: () => void queryClient.invalidateQueries(trpc.views.session.pathFilter()),
    }),
  );
  const start = () => {
    const target = window.open('about:blank', '_blank');
    if (target) target.opener = null;
    link.mutate(undefined, {
      onSuccess: (result) => {
        if (result.kind !== 'link') return;
        if (target) target.location.replace(result.url);
        else window.location.assign(result.url);
      },
      onError: () => target?.close(),
    });
  };
  return {
    start,
    unlink: () => unlink.mutate(),
    busy: link.isPending || unlink.isPending,
  };
};

export const useLocaleChoice = () => {
  const queryClient = useQueryClient();
  const remember = useMutation(
    trpc.account.locale.mutationOptions({
      onSettled: () => void queryClient.invalidateQueries(),
    }),
  );
  return (next: Locale) => {
    void chooseLocale(next).then(() => remember.mutate(next));
  };
};

export const useSignOut = () => {
  const logout = useMutation(
    trpc.account.logout.mutationOptions({
      onSuccess: () => window.location.assign('/'),
    }),
  );
  return { signOut: () => logout.mutate(), busy: logout.isPending };
};
