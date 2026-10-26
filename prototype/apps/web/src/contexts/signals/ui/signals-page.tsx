import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { dataColumnClass } from '~/shared/ui/page-column';
import { useOpenSignal } from '../api/use-open-signal';
import { QuietSignals } from './quiet-signals';
import { SignalTimeline, timelineGridClass } from './signal-timeline';

const NOW_TICK_MS = 30_000;
const SKELETON_ROWS = ['a', 'b', 'c', 'd'] as const;

const timelineColumnClass = 'mx-auto w-full max-w-[45rem] pt-10 md:pt-20';

export function SignalsPage() {
  const { t } = useT('signals');
  const signals = useQuery(trpc.views.signals.queryOptions(undefined, { meta: { silent: true } }));
  const open = useOpenSignal();
  const now = useServerNow(NOW_TICK_MS);
  return (
    <div className={dataColumnClass}>
      <Heading as="h1" size="page">
        {t('page.title')}
      </Heading>
      <div className={timelineColumnClass}>
        <AppBoundary tier="section" scope="signals-timeline">
          <AsyncView query={signals} errorTitle={t('page.failed')} loading={<TimelineSkeleton />}>
            {(data) =>
              data.quiet !== null && data.items.length === 0 ? (
                <QuietSignals quiet={data.quiet} />
              ) : (
                <SignalTimeline items={data.items} now={now} onOpen={open} />
              )
            }
          </AsyncView>
        </AppBoundary>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  const { t } = useT('signals');
  return (
    <div className="flex flex-col">
      {SKELETON_ROWS.map((row) => (
        <div key={row} className={cn(timelineGridClass, 'pb-14')}>
          <span className="flex h-7.5 items-center justify-end">
            <Skeleton className="h-3 w-10" />
          </span>
          <span className="flex h-7.5 items-center justify-center">
            <Skeleton className="size-2.25 rounded-full" />
          </span>
          <div className="flex min-w-0 items-center gap-7">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex min-h-7.5 items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <SkeletonLines className="text-row">{t('page.title')}</SkeletonLines>
              </span>
              <SkeletonLines className="text-meta">{t('page.lead')}</SkeletonLines>
            </div>
            <Skeleton className="hidden h-7.5 w-24 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}
