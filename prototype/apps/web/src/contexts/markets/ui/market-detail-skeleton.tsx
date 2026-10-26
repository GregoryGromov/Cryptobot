import { Skeleton } from '@reinforce/ui-react/skeleton';
import { useT } from '~/shared/i18n';
import {
  CHART_PANEL_CLASS,
  HEAD_CLASS,
  PANEL_HEAD_CLASS,
  PANEL_TITLE_CLASS,
  SIDE_PANEL_CLASS,
  TERMINAL_GRID_CLASS,
} from './terminal-layout';

const STATS = ['a', 'b', 'c', 'd'] as const;
const SIGNALS = ['a', 'b', 'c'] as const;
const MOVES = ['a', 'b', 'c', 'd'] as const;
const PEERS = ['a', 'b'] as const;

export function MarketDetailSkeleton() {
  const { t } = useT('markets');
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className={HEAD_CLASS}>
        <span className="flex items-center gap-2.5 py-1.5 ps-1.5">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-5 w-28" />
        </span>
        <span className="ms-auto flex flex-col items-end gap-1.5 sm:ms-0 sm:items-start">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </span>
        <span className="flex basis-full gap-x-6 sm:basis-auto lg:flex-1">
          {STATS.map((stat) => (
            <span key={stat} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-14" />
            </span>
          ))}
        </span>
        <Skeleton className="h-10.5 w-48 rounded-full max-sm:w-full" />
      </div>
      <div className={TERMINAL_GRID_CLASS}>
        <div className={CHART_PANEL_CLASS}>
          <Skeleton className="h-full rounded-2xl" />
        </div>
        <div className={SIDE_PANEL_CLASS}>
          <SideGroup title={t('moves.title')} rows={MOVES} />
          <SideGroup title={t('compare.title')} rows={PEERS} />
          <SideGroup title={t('signals.title')} rows={SIGNALS} tall />
        </div>
      </div>
    </div>
  );
}

function SideGroup({
  title,
  rows,
  tall = false,
}: {
  readonly title: string;
  readonly rows: readonly string[];
  readonly tall?: boolean;
}) {
  return (
    <span className="flex flex-col gap-2.5">
      <span className={PANEL_HEAD_CLASS}>
        <span className={PANEL_TITLE_CLASS}>{title}</span>
      </span>
      {rows.map((row) => (
        <Skeleton key={row} className={tall ? 'h-9 w-full' : 'h-4 w-full'} />
      ))}
    </span>
  );
}
