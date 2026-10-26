import type { Trades } from '@reinforce/server/dto';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { useQuery } from '@tanstack/react-query';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { dataColumnClass } from '~/shared/ui/page-column';
import { type BookKey, bookView } from '../domain/book-vm';
import { cycleOf, type PortfolioSearch } from '../domain/portfolio-search';
import { BookFacts } from './book-facts';
import { BookTiles, TILES_COLUMN_CLASS } from './book-tiles';
import { BookTrades } from './book-trades';
import { CycleSelect } from './cycle-select';
import { EquityChart } from './equity-chart';
import { ForecastTile } from './forecast-tile';
import { BLOCKS_CLASS, CHART_SPAN_CLASS, PortfolioSkeleton, TOP_CLASS } from './portfolio-skeleton';
import { TradeSheet } from './trade-sheet';

const NOW_TICK = 30_000;

export function PortfolioPage({ search }: { readonly search: PortfolioSearch }) {
  const { t } = useT('portfolio');
  const portfolio = useQuery(trpc.views.portfolio.queryOptions());
  return (
    <div className={dataColumnClass}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading as="h1" size="page">
          {t('title')}
        </Heading>
        <Text variant="muted" className="text-meta">
          {t('lead')}
        </Text>
      </header>
      <AppBoundary tier="section" scope="portfolio">
        <AsyncView query={portfolio} errorTitle={t('failed')} loading={<PortfolioSkeleton />}>
          {(trades) => <Portfolio trades={trades} search={search} />}
        </AsyncView>
      </AppBoundary>
      <TradeSheet tradeId={search.trade} trades={portfolio.data} />
    </div>
  );
}

function Portfolio({ trades, search }: { readonly trades: Trades; readonly search: PortfolioSearch }) {
  const now = useServerNow(NOW_TICK);
  const picked: BookKey = search.book ?? 'user';
  const view = bookView(trades[picked], cycleOf(search, picked), now);
  return (
    <>
      <CycleSelect view={view} />
      <div className={BLOCKS_CLASS}>
        <div className={TOP_CLASS}>
          <div className={TILES_COLUMN_CLASS}>
            <BookTiles trades={trades} picked={picked} />
            <AppBoundary tier="panel" scope="portfolio-score">
              <ForecastTile />
            </AppBoundary>
          </div>
          <BookFacts view={view} />
          <AppBoundary tier="panel" scope={`equity-${view.key}`}>
            <EquityChart view={view} period={search.period ?? 'all'} className={CHART_SPAN_CLASS} />
          </AppBoundary>
        </div>
        <BookTrades key={`${view.key}-${view.cycle?.id ?? ''}`} view={view} tab={search.tab} />
      </div>
    </>
  );
}
