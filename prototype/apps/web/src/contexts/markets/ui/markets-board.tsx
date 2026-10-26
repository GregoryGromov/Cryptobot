import type { MarketList } from '@reinforce/server/dto';
import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWatchMarkets } from '~/contexts/markets/api/use-watch-markets';
import { hourStories } from '~/contexts/markets/domain/hour-stories';
import { freshCoins, marketsVm } from '~/contexts/markets/domain/market-list-vm';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { HourStories } from './hour-stories';
import { MarketRowView, marketRowGridClass } from './market-row';
import { MarketClasses, type MarketsSearch } from './markets-toolbar';

const CLOCK_MS = 30_000;

export function MarketsBoard({
  list,
  search,
  onSearch,
}: {
  readonly list: MarketList;
  readonly search: MarketsSearch;
  readonly onSearch: (search: MarketsSearch) => void;
}) {
  const { t } = useT('markets');
  const now = useServerNow(CLOCK_MS);
  const signals = useQuery(trpc.views.signals.queryOptions(undefined, { meta: { silent: true } }));
  const items = signals.data?.items ?? [];
  const vm = marketsVm(list, { cls: search.cls, q: search.q }, freshCoins(items, now));
  const watch = useWatchMarkets();
  const notFound = vm.rows.length === 0;
  return (
    <div className="flex flex-col gap-4">
      {!vm.searching && <HourStories stories={hourStories(list)} />}
      <MarketClasses
        classes={vm.classes}
        selected={vm.selected}
        onSearch={onSearch}
        onFollowClass={(group, on) => watch(group.coins, on)}
      />
      <p role="status" className={cn('text-muted-foreground text-sm', !notFound && 'sr-only')}>
        {notFound ? t('notFound') : ''}
      </p>
      {!notFound && (
        <MarketTable>
          {vm.rows.map((row) => (
            <MarketRowView key={row.key} row={row} onFollow={(on) => watch([row.coin], on)} />
          ))}
        </MarketTable>
      )}
    </div>
  );
}

export function MarketTable({ children }: { readonly children: ReactNode }) {
  const { t } = useT('markets');
  return (
    <section aria-label={t('list')} className={cn(sectionCardClass, 'px-4 pt-1 sm:px-6 sm:pt-2')}>
      <div
        aria-hidden
        className={cn(
          marketRowGridClass,
          'hidden items-center gap-x-3.5 pt-3 pb-2.5 text-meta text-muted-foreground sm:grid',
        )}
      >
        <span />
        <span>{t('cols.market')}</span>
        <span className="text-end">{t('cols.price')}</span>
        <span className="text-end">{t('cols.hour')}</span>
        <span className="text-center">{t('cols.chart')}</span>
        <span className="text-center">{t('cols.follow')}</span>
      </div>
      <ul className="flex flex-col sm:border-foreground/7 sm:border-t">{children}</ul>
    </section>
  );
}
