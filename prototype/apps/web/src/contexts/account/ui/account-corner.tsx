import type { Session } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@reinforce/ui-react/dropdown-menu';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useMutation } from '@tanstack/react-query';
import { ChevronsUpDown, LogIn, LogOut, UserRound } from 'lucide-react';
import { useAgentStaked } from '~/contexts/agents/api/agent-store';
import { PremiumBadge } from '~/contexts/agents/ui/premium-badge';
import { useSession } from '~/shared/api/session';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { useSignIn } from './sign-in';

type Free = Session['ai']['free'];

export function AccountCorner({ compact = false }: { readonly compact?: boolean }) {
  const { t } = useT('account');
  const session = useSession();
  if (compact) return session.data ? <AccountEntry session={session.data} compact /> : null;
  return (
    <AsyncView query={session} errorTitle={t('failed')} loading={<AccountTwin />}>
      {(data) => <AccountEntry session={data} compact={false} />}
    </AsyncView>
  );
}

function AccountEntry({ session, compact }: { readonly session: Session; readonly compact: boolean }) {
  if (!session.user.guest)
    return <AccountMenu name={session.user.name} free={session.ai.free} compact={compact} />;
  if (!session.auth.xaiAvailable) return null;
  return <SignInButton compact={compact} />;
}

function SignInButton({ compact }: { readonly compact: boolean }) {
  const { t } = useT('common');
  const { start } = useSignIn();
  if (compact)
    return (
      <Button size="icon-lg" aria-label={t('signIn')} onClick={start}>
        <LogIn strokeWidth={1.75} />
      </Button>
    );
  return (
    <Button size="compact" className="w-full" onClick={start}>
      <LogIn strokeWidth={1.75} />
      {t('signIn')}
    </Button>
  );
}

function AccountMenu({
  name,
  free,
  compact,
}: {
  readonly name: string;
  readonly free: Free;
  readonly compact: boolean;
}) {
  const { t } = useT(['account', 'common']);
  const fmt = useFormatters();
  const logout = useMutation(
    trpc.account.logout.mutationOptions({
      onSuccess: () => window.location.assign('/'),
    }),
  );
  const staked = useAgentStaked();
  const short = t('menu.short', { left: free.left, limit: free.limit });
  const quota = free.left > 0 ? t('menu.left', { left: free.left, count: free.limit }) : t('menu.over');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={compact ? t('menu.open', { name, quota: short }) : undefined}
        className={cn(
          'focus-ring hover-neutral-soft flex min-w-0 items-center gap-2.5 rounded-md text-start transition-colors data-[state=open]:bg-foreground/5',
          compact ? 'size-10 justify-center' : 'h-12 w-full px-1.5',
        )}
      >
        <Avatar name={name} />
        {!compact && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-medium text-foreground text-sm">{name}</span>
                {staked && <PremiumBadge />}
              </span>
              <span className="truncate text-muted-foreground text-xs">{short}</span>
            </span>
            <ChevronsUpDown
              aria-hidden
              strokeWidth={1.75}
              className="size-4 shrink-0 text-muted-foreground"
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? 'right' : 'top'}
        align={compact ? 'end' : 'start'}
        className="w-64"
      >
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-semibold">{name}</span>
          <span className="font-normal text-muted-foreground text-xs leading-snug">{quota}</span>
          {free.left < free.limit && (
            <span className="font-normal text-muted-foreground text-xs leading-snug">
              {t('menu.reset', { time: fmt.clock(free.resetAt) })}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          <LogOut strokeWidth={1.75} />
          {t('common:signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ name }: { readonly name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/8 font-semibold text-foreground text-sm"
    >
      {initial === '' ? <UserRound strokeWidth={1.75} className="size-4" /> : initial}
    </span>
  );
}

function AccountTwin() {
  return (
    <div aria-hidden className="flex h-12 items-center gap-2.5 px-1.5">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <span className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-2.5 w-16 rounded-full" />
      </span>
    </div>
  );
}
