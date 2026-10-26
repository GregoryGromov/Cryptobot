import { listRowVariants } from '@reinforce/ui-primitives/list-row';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Star, Zap } from 'lucide-react';
import type { MarketRow } from '~/contexts/markets/domain/market-list-vm';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { HourSpark } from './hour-spark';

export const marketRowGridClass =
  'grid-cols-[1.75rem_minmax(0,1fr)_auto_2rem] sm:grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_5.5rem_6.5rem_4rem]';

export function MarketRowView({
  row,
  onFollow,
}: {
  readonly row: MarketRow;
  readonly onFollow: (on: boolean) => void;
}) {
  const { t } = useT('markets');
  const { price, change } = useFormatters();
  return (
    <li
      className={cn(
        listRowVariants(),
        marketRowGridClass,
        'hover-neutral-soft relative -mx-2 rounded-md px-2',
      )}
    >
      <CoinLogo coin={row.coin} ticker={row.ticker} />
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 sm:flex-nowrap">
        <Link
          to="/markets"
          search={(prev) => ({ ...prev, m: row.key })}
          className="focus-ring truncate rounded-sm font-medium text-foreground text-row after:absolute after:inset-0"
        >
          {row.name}
        </Link>
        {row.ticker !== row.name && (
          <span className="order-last basis-full truncate text-meta text-muted-foreground sm:order-none sm:basis-auto">
            {row.ticker}
          </span>
        )}
        {row.fresh && (
          <>
            <Zap aria-hidden strokeWidth={2} className="size-3.5 shrink-0 fill-current text-foreground" />
            <span className="sr-only">{t('fresh')}</span>
          </>
        )}
      </span>
      <span className="flex flex-col items-end sm:contents">
        {row.price === null ? (
          <span className="text-meta text-muted-foreground sm:justify-self-end">{t('noPrice')}</span>
        ) : (
          <Numeral weight="medium" className="text-row sm:justify-self-end">
            {price(row.price)}
          </Numeral>
        )}
        <Numeral
          tone="direction"
          direction={row.direction}
          className="text-meta sm:justify-self-end sm:text-row"
        >
          {row.change === null ? '' : change(row.change, 2)}
        </Numeral>
      </span>
      <HourSpark
        values={row.spark}
        direction={row.direction}
        className="hidden justify-self-center sm:block"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative z-10 justify-self-center"
        aria-pressed={row.watched}
        aria-label={t('follow', { name: row.name })}
        onClick={() => onFollow(!row.watched)}
      >
        <Star className={row.watched ? 'fill-current text-foreground' : 'text-muted-foreground'} />
      </Button>
    </li>
  );
}
