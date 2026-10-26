import type { Horizon } from '@reinforce/server/dto';
import { listRowMoreClass, listRowVariants } from '@reinforce/ui-primitives/list-row';
import { Button } from '@reinforce/ui-react/button';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type JournalRow, journalRows } from '~/contexts/broker/domain/journal-vm';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useSession } from '~/shared/api/session';
import { useTradingMode } from '~/shared/api/trading-mode';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { JournalItem, journalRowGridClass } from './journal-item';

const PAGE = 30;
const TWIN_ROWS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

const frameClass = 'flex flex-col px-4';

export function ForecastJournal() {
  const { t } = useT('broker');
  const { horizon } = useTradingMode();
  const journal = useQuery(trpc.views.journal.queryOptions());
  return (
    <AsyncView
      query={journal}
      errorTitle={t('journal.failed')}
      loading={<JournalSkeleton horizon={horizon} />}
      empty={{ when: (data) => journalRows(data, horizon).length === 0, render: <JournalEmpty /> }}
    >
      {(data) => <JournalList rows={journalRows(data, horizon)} horizon={horizon} />}
    </AsyncView>
  );
}

function JournalEmpty() {
  const { t } = useT('broker');
  return (
    <p role="status" className="px-4 pt-2.5 pb-1.5 text-foreground-soft text-meta">
      {t('journal.empty')}
    </p>
  );
}

function JournalFrame({ horizon, children }: { readonly horizon: Horizon; readonly children: ReactNode }) {
  const { t } = useT('broker');
  const { t: tf } = useT('format');
  return (
    <div className={frameClass}>
      <div
        aria-hidden
        className={cn(
          journalRowGridClass,
          'hidden items-end gap-x-3.5 pt-2.5 pb-1.5 text-muted-foreground text-xs sm:grid',
        )}
      >
        <span />
        <span>{t('journal.cols.market')}</span>
        <span>{t('journal.cols.when')}</span>
        <span>{t('journal.cols.forecast', { term: horizonWords(tf, horizon) })}</span>
        <span className="justify-self-center">{t('journal.cols.result')}</span>
      </div>
      {children}
    </div>
  );
}

function JournalList({ rows, horizon }: { readonly rows: readonly JournalRow[]; readonly horizon: Horizon }) {
  const { t } = useT('broker');
  const [shown, setShown] = useState(PAGE);
  const instruments = useSession().data?.market.instruments ?? [];
  const several = new Set(rows.map((row) => row.version)).size > 1;
  return (
    <JournalFrame horizon={horizon}>
      <ul className="flex flex-col sm:border-foreground/7 sm:border-t">
        {rows.slice(0, shown).map((row) => (
          <JournalItem
            key={row.id}
            row={row}
            market={instruments.find((market) => market.coin === row.coin)}
            several={several}
          />
        ))}
      </ul>
      {shown < rows.length && (
        <Button variant="ghost" size="sm" className={listRowMoreClass} onClick={() => setShown(shown + PAGE)}>
          {t('journal.more')}
        </Button>
      )}
    </JournalFrame>
  );
}

function JournalSkeleton({ horizon }: { readonly horizon: Horizon }) {
  return (
    <div aria-hidden>
      <JournalFrame horizon={horizon}>
        <ul className="flex flex-col sm:border-foreground/7 sm:border-t">
          {TWIN_ROWS.map((row) => (
            <li key={row} className={cn(listRowVariants(), journalRowGridClass)}>
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="hidden h-3 w-24 sm:block" />
              <Skeleton className="h-4 w-24 justify-self-end sm:justify-self-start" />
              <Skeleton className="hidden size-6.5 justify-self-center rounded-full sm:block" />
            </li>
          ))}
        </ul>
      </JournalFrame>
    </div>
  );
}
