import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { PromptEditor } from './prompt-editor';
import { VersionList } from './version-list';

const layoutClass = 'grid gap-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start';

export function BrokerInstructions() {
  const { t } = useT('broker');
  const agent = useQuery(trpc.views.broker.queryOptions());
  return (
    <AsyncView query={agent} errorTitle={t('failed')} loading={<InstructionsSkeleton />}>
      {(data) => (
        <div className={layoutClass}>
          <AppBoundary tier="panel" scope="broker-editor">
            <PromptEditor agent={data} />
          </AppBoundary>
          <AppBoundary tier="panel" scope="broker-versions">
            <VersionList versions={data.versions} />
          </AppBoundary>
        </div>
      )}
    </AsyncView>
  );
}

function InstructionsSkeleton() {
  const { t } = useT('broker');
  return (
    <div aria-hidden className={layoutClass}>
      <div className={cn(sectionCardClass, 'flex flex-col gap-4 px-4 pb-5 sm:px-6')}>
        <Skeleton className="h-56" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-full sm:w-52" />
          <Skeleton className="h-9 min-w-48 flex-1" />
          <Skeleton className="h-9 w-full rounded-full sm:w-56" />
        </div>
      </div>
      <div className={cn(sectionCardClass, 'flex flex-col gap-3 px-4 pb-5 sm:px-6')}>
        <Heading as="h2" size="section">
          <SkeletonLines>{t('versions.title')}</SkeletonLines>
        </Heading>
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
