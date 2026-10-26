import { cardVariants } from '@reinforce/ui-primitives/card';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { SCORE_FROM, type Score, scoreOf } from '~/contexts/broker/domain/overview-vm';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useTradingMode } from '~/shared/api/trading-mode';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { TILE_CLASS, TILE_FIGURE_CLASS } from './book-tiles';

export function ForecastTile() {
  const { t } = useT('portfolio');
  const { t: tf } = useT('format');
  const { horizon } = useTradingMode();
  const broker = useQuery(trpc.views.broker.queryOptions(undefined, { meta: { silent: true } }));
  return (
    <Link
      to="/portfolio"
      search={(prev) => ({ ...prev, tab: 'forecasts' as const })}
      replace
      resetScroll={false}
      className={cn(
        cardVariants({ size: 'sm', interactive: true }),
        TILE_CLASS,
        'focus-ring text-foreground',
      )}
    >
      <span className="flex items-baseline justify-between gap-2 text-meta">
        <span className="truncate font-medium">{t('score.title')}</span>
        <span className="@[11.5rem]:inline hidden font-figure text-muted-foreground">
          {horizonWords(tf, horizon)}
        </span>
      </span>
      {broker.data === undefined ? (
        <ScorePending failed={broker.isError} />
      ) : (
        <ScoreFigure score={scoreOf(broker.data.scorecard.terms, horizon)} />
      )}
    </Link>
  );
}

function ScorePending({ failed }: { readonly failed: boolean }) {
  const { t } = useT('portfolio');
  return failed ? (
    <span className={cn(TILE_FIGURE_CLASS, 'text-muted-foreground')}>{t('score.none')}</span>
  ) : (
    <Skeleton className="my-1 h-6 w-24" />
  );
}

function ScoreFigure({ score }: { readonly score: Score }) {
  const { t } = useT('portfolio');
  const { int } = useFormatters();
  return match(score)
    .with({ kind: 'tenths' }, ({ tenths }) => (
      <span className={TILE_FIGURE_CLASS}>{t('score.tenths', { hits: int(tenths) })}</span>
    ))
    .with({ kind: 'early' }, ({ n }) => (
      <span className="flex flex-col gap-1.5 pt-1.5">
        <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <span
            className="block h-full min-w-1.5 rounded-full bg-foreground/55"
            style={{ width: `${(n / SCORE_FROM) * 100}%` }}
          />
        </span>
        <span className="text-muted-foreground text-xs leading-snug">
          {t('score.early', { from: int(SCORE_FROM), n: int(n) })}
        </span>
      </span>
    ))
    .exhaustive();
}
