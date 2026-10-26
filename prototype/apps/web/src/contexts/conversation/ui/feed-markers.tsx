import type { LiveSignal } from '@reinforce/server/dto';
import { useQuery } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { LiveSignalMessage } from '~/contexts/signals/ui/live-signal';
import { trpc } from '~/shared/api/trpc';
import { calendarDayOf } from '~/shared/format/time';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { UNREAD_ANCHOR } from '../domain/feed';

export function DayMarker({ at, now }: { readonly at: number; readonly now: number }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const label = match(calendarDayOf(at, now))
    .with('today', () => t('days.today'))
    .with('yesterday', () => t('days.yesterday'))
    .with('earlier', () => f.day(at))
    .exhaustive();
  return (
    <p className="mt-8 self-center rounded-full bg-foreground/5 px-2.5 py-0.5 font-medium text-muted-foreground text-xs first:mt-0">
      {label}
    </p>
  );
}

export function UnreadLine() {
  const { t } = useT('conversation');
  return (
    <p
      id={UNREAD_ANCHOR}
      className="mt-7 flex scroll-mt-20 items-center gap-3 font-semibold text-foreground text-xs before:h-px before:flex-1 before:bg-foreground/15 after:h-px after:flex-1 after:bg-foreground/15"
    >
      {t('feed.unread')}
    </p>
  );
}

function LiveSignals({ live }: { readonly live: LiveSignal }) {
  const signals = useQuery(trpc.views.signals.queryOptions());
  const earlier = (signals.data?.items ?? []).filter(
    (signal) => live.kind !== 'signal' || signal.eventId !== live.eventId,
  );
  return <LiveSignalMessage live={live} earlier={earlier} />;
}

export function LiveBlock({ live }: { readonly live: LiveSignal | null }) {
  if (live === null) return null;
  return (
    <div className="mt-6 flex w-full flex-col items-start">
      <AppBoundary tier="panel" scope="live-signal">
        <LiveSignals live={live} />
      </AppBoundary>
    </div>
  );
}
