import { cardVariants } from '@reinforce/ui-primitives/card';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { BOOKS } from '../domain/portfolio-search';
import { FACT_CLASS, PANEL_CLASS, PANEL_HEAD_CLASS, PANEL_TITLE_CLASS } from './book-facts';
import { TILE_CLASS, TILE_FIGURE_CLASS, TILES_CLASS } from './book-tiles';
import {
  HEAD_CLASS,
  LINE_CLASS,
  OPEN_COLUMNS,
  TRADES_CLASS,
  TRADES_TABS_CLASS,
  WIDE_CLASS,
} from './book-trades';

export const BLOCKS_CLASS = '@container flex flex-col gap-2';
export const TOP_CLASS =
  'grid gap-2 @2xl:grid-cols-[15.5rem_minmax(0,1fr)] @4xl:grid-cols-[15.5rem_19rem_minmax(0,1fr)]';
export const CHART_SPAN_CLASS = '@2xl:col-span-2 @4xl:col-span-1';

const STATS = ['realized', 'unrealized', 'fees', 'drawdown', 'wins'] as const;
const NAV_TWIN = 10_000;
const ROWS = [0, 1, 2] as const;

export function PortfolioSkeleton() {
  const { t } = useT('portfolio');
  const nav = useFormatters().usd(NAV_TWIN);
  return (
    <div aria-busy className={BLOCKS_CLASS}>
      <div className={TOP_CLASS}>
        <div className={TILES_CLASS}>
          {BOOKS.map((book) => (
            <div key={book} className={cn(cardVariants({ size: 'sm' }), TILE_CLASS)}>
              <span className="text-meta text-muted-foreground">{t(`books.${book}.label`)}</span>
              <span className={TILE_FIGURE_CLASS}>
                <SkeletonLines>{nav}</SkeletonLines>
              </span>
            </div>
          ))}
        </div>
        <div className={PANEL_CLASS}>
          <div className={PANEL_HEAD_CLASS}>
            <span className={PANEL_TITLE_CLASS}>
              <SkeletonLines>{t('books.user.label')}</SkeletonLines>
            </span>
          </div>
          <dl className="flex flex-col text-meta">
            {STATS.map((stat) => (
              <div key={stat} className={FACT_CLASS}>
                <dt className="text-muted-foreground">{t(`stats.${stat}`)}</dt>
                <dd>
                  <SkeletonLines>{nav}</SkeletonLines>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={cn(PANEL_CLASS, CHART_SPAN_CLASS)}>
          <div className={PANEL_HEAD_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>{t('chart.title')}</h2>
          </div>
          <Skeleton className="min-h-44 w-full flex-1" />
        </div>
      </div>
      <div className={TRADES_CLASS}>
        <div
          className={cn(
            TRADES_TABS_CLASS,
            'flex h-10 items-center font-medium text-muted-foreground text-sm',
          )}
        >
          <span>{t('trades.positions')}</span>
          <span>{t('trades.history')}</span>
        </div>
        <div className={cn(LINE_CLASS, OPEN_COLUMNS, HEAD_CLASS)}>
          <span>{t('trades.cols.trade')}</span>
          <span className={cn(WIDE_CLASS, 'text-end')}>{t('trades.cols.amount')}</span>
          <span className={cn(WIDE_CLASS, 'text-end')}>{t('trades.cols.closes')}</span>
          <span className="text-end">{t('trades.cols.result')}</span>
        </div>
        {ROWS.map((row) => (
          <div key={row} className={cn(LINE_CLASS, 'py-1.5')}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
