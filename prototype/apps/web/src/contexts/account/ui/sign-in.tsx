import { insetPanelClass } from '@reinforce/ui-primitives/inset-panel';
import { Button } from '@reinforce/ui-react/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@reinforce/ui-react/dialog';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useEffect, useEffectEvent } from 'react';
import { match } from 'ts-pattern';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { loginFailureText } from '../api/login-failure';
import { type Device, type SignInFlow, visibleFlow } from '../domain/sign-in-flow';
import { useSignInActions, useSignInFlow } from './sign-in-store';

const POLL_MS = 2_500;

const pendingOptions = () =>
  trpc.account.grok.pending.queryOptions(undefined, {
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    meta: { silent: true },
  });

export const useSignIn = (): { readonly start: () => void } => {
  const { stepped } = useSignInActions();
  const begin = useMutation(
    trpc.account.grok.start.mutationOptions({
      meta: { silent: true },
      onMutate: () => stepped({ kind: 'requested' }, null),
      onSuccess: (device) => stepped({ kind: 'issued', device }, null),
      onError: (error) => stepped({ kind: 'failed', reason: loginFailureText(error) }, null),
    }),
  );
  return { start: () => begin.mutate() };
};

export function SignInHost() {
  const { t } = useT(['account', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { stepped } = useSignInActions();
  const { start } = useSignIn();
  const pending = useQuery(pendingOptions());
  const resumable = pending.data?.device ?? null;
  const flow = visibleFlow(useSignInFlow(), resumable);
  const cancel = useMutation(trpc.account.grok.cancel.mutationOptions({ meta: { silent: true } }));
  const poll = useMutation(trpc.account.grok.status.mutationOptions({ meta: { silent: true } }));

  const forgetResumable = () => {
    queryClient.setQueryData(pendingOptions().queryKey, { device: null });
  };

  const close = () => {
    if (flow.kind === 'starting' || flow.kind === 'waiting') cancel.mutate();
    poll.reset();
    forgetResumable();
    stepped({ kind: 'closed' }, null);
  };

  const connected = (chat: string | null) => {
    poll.reset();
    stepped({ kind: 'closed' }, null);
    void queryClient.resetQueries();
    if (chat) void navigate(topicLink(chat));
  };

  const check = useEffectEvent(() => {
    if (poll.isPending) return;
    poll.mutate(undefined, {
      onSuccess: (result) =>
        match(result)
          .with({ status: 'pending' }, () => undefined)
          .with({ status: 'connected' }, ({ chat }) => connected(chat))
          .exhaustive(),
      onError: (error) => {
        forgetResumable();
        stepped({ kind: 'failed', reason: loginFailureText(error) }, resumable);
      },
    });
  });

  const waitingCode = flow.kind === 'waiting' ? flow.device.userCode : null;
  useEffect(() => {
    if (waitingCode === null) return;
    const timer = window.setInterval(check, POLL_MS);
    const back = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', back);
    window.addEventListener('focus', back);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('focus', back);
    };
  }, [waitingCode]);

  return (
    <Dialog
      open={flow.kind !== 'closed'}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent size="sm" closeButton={{ label: t('common:close') }}>
        <DialogHeader>
          <DialogTitle>{t('signIn.title')}</DialogTitle>
          <DialogDescription>{t('signIn.lead')}</DialogDescription>
        </DialogHeader>
        <SignInBody flow={flow} onRetry={start} />
      </DialogContent>
    </Dialog>
  );
}

function SignInBody({ flow, onRetry }: { readonly flow: SignInFlow; readonly onRetry: () => void }) {
  const { t } = useT('account');
  return match(flow)
    .with({ kind: 'closed' }, () => null)
    .with({ kind: 'starting' }, () => (
      <div className="flex flex-col gap-3">
        <CodePanel device={null} />
        <p className="text-muted-foreground text-sm">{t('signIn.check')}</p>
        <Button size="lg" className="w-full" loading>
          {t('signIn.open')}
        </Button>
        <p role="status" className="sr-only">
          {t('signIn.preparing')}
        </p>
      </div>
    ))
    .with({ kind: 'waiting' }, ({ device }) => (
      <div className="flex flex-col gap-3">
        <CodePanel device={device} />
        <p className="text-muted-foreground text-sm">{t('signIn.check')}</p>
        <Button asChild size="lg" className="w-full">
          <a href={device.url} target="_blank" rel="noopener noreferrer">
            {t('signIn.open')}
            <ArrowUpRight aria-hidden strokeWidth={2} />
            <span className="sr-only">{t('signIn.newTab')}</span>
          </a>
        </Button>
        <p role="status" className="flex items-center gap-2 text-meta text-muted-foreground">
          <LoaderCircle aria-hidden strokeWidth={2} className="size-3.5 shrink-0 motion-safe:animate-spin" />
          {t('signIn.waiting')}
        </p>
      </div>
    ))
    .with({ kind: 'failed' }, ({ reason }) => (
      <div className="flex flex-col gap-3">
        <InlineNote tone="warning" icon={TriangleAlert} title={t('signIn.failed')} role="alert">
          {reason}
        </InlineNote>
        <Button size="lg" className="w-full" onClick={onRetry}>
          {t('signIn.retry')}
        </Button>
      </div>
    ))
    .exhaustive();
}

function CodePanel({ device }: { readonly device: Device | null }) {
  const { t } = useT('account');
  return (
    <div className={cn(insetPanelClass, 'flex flex-col items-center gap-1.5 px-4 py-4')}>
      <span className="text-muted-foreground text-xs">{t('signIn.code')}</span>
      {device ? (
        <span className="select-all font-mono font-semibold text-2xl text-foreground tracking-[0.18em]">
          {device.userCode}
        </span>
      ) : (
        <Skeleton className="h-8 w-40 rounded-md" />
      )}
    </div>
  );
}
