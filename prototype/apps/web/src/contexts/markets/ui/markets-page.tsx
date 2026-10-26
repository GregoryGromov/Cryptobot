import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { hasMarkets, marketOf } from '~/contexts/markets/domain/market-list-vm';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { dataColumnClass } from '~/shared/ui/page-column';
import { MarketDetail } from './market-detail';
import { MarketDetailSkeleton } from './market-detail-skeleton';
import { MarketsBoard } from './markets-board';
import { MarketsSkeleton } from './markets-skeleton';
import { MarketSearch, type MarketsSearch } from './markets-toolbar';

export type { MarketsSearch };

export function MarketsPage({
  search,
  onSearch,
}: {
  readonly search: MarketsSearch & { readonly m?: string | undefined };
  readonly onSearch: (search: MarketsSearch) => void;
}) {
  const { t } = useT('markets');
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const opened = search.m !== undefined && !(catalog.data && marketOf(catalog.data, search.m) === null);
  return (
    <div className={cn(dataColumnClass, opened && 'pt-2 md:pt-2')}>
      {!opened && (
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading as="h1" size="page">
            {t('title')}
          </Heading>
          <MarketSearch q={search.q} onSearch={onSearch} />
        </header>
      )}
      <AppBoundary tier="section" scope="markets">
        <AsyncView
          query={catalog}
          errorTitle={t('failed')}
          loading={opened ? <MarketDetailSkeleton /> : <MarketsSkeleton />}
          empty={{
            when: (list) => !hasMarkets(list),
            render: (
              <InlineNote tone="neutral" role="status">
                {t('empty')}
              </InlineNote>
            ),
          }}
        >
          {(list) => {
            const market = marketOf(list, search.m);
            return market ? (
              <MarketDetail market={market} list={list} />
            ) : (
              <MarketsBoard list={list} search={search} onSearch={onSearch} />
            );
          }}
        </AsyncView>
      </AppBoundary>
    </div>
  );
}
