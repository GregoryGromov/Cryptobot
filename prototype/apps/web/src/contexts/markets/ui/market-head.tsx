import { Button } from '@reinforce/ui-react/button';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, MessageCircle, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { useWatchMarkets } from '~/contexts/markets/api/use-watch-markets';
import type { ListedMarket } from '~/contexts/markets/domain/market-list-vm';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { HEAD_CLASS } from './terminal-layout';

const FUNDING_DIGITS = 4;

export function MarketHead({ market }: { readonly market: ListedMarket }) {
  const { t } = useT('markets');
  const f = useFormatters();
  const watch = useWatchMarkets();
  const times = (ratio: number) => t('stats.times', { ratio: f.decimal(ratio, 1) });
  return (
    <section aria-label={t('stats.label', { name: market.name })} className={HEAD_CLASS}>
      <div className="flex min-w-0 items-center gap-1">
        <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground">
          <Link to="/markets" search={(prev) => ({ ...prev, m: undefined })} aria-label={t('back')}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2.5 py-1.5 ps-1 pe-1.5">
          <CoinLogo coin={market.coin} ticker={market.ticker} size="lg" />
          <span className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate font-semibold text-foreground text-lg">{market.name}</h1>
            {market.ticker !== market.name && (
              <span className="truncate text-meta text-muted-foreground">{market.ticker}</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={market.watched}
          aria-label={t('follow', { name: market.name })}
          onClick={() => watch([market.coin], !market.watched)}
        >
          <Star className={market.watched ? 'fill-current text-foreground' : 'text-muted-foreground'} />
        </Button>
      </div>
      <div className="ms-auto flex flex-col items-end leading-tight sm:ms-0 sm:items-start">
        {market.price === null ? (
          <span className="text-meta text-muted-foreground">{t('noPrice')}</span>
        ) : (
          <Numeral weight="semibold" className="text-foreground text-lg">
            {f.price(market.price)}
          </Numeral>
        )}
        {market.change1h !== null && (
          <span className="flex items-baseline gap-1.5 text-meta">
            <Numeral tone="direction" direction={directionOf(market.change1h, 2)}>
              {f.change(market.change1h, 2)}
            </Numeral>
            <span className="text-muted-foreground">{t('stats.hour')}</span>
          </span>
        )}
      </div>
      <dl className="-mx-3 flex basis-full gap-x-6 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:basis-auto sm:px-0 lg:flex-1">
        {market.change24h !== null && (
          <Stat label={t('stats.day')}>
            <Numeral tone="direction" direction={directionOf(market.change24h, 2)}>
              {f.change(market.change24h, 2)}
            </Numeral>
          </Stat>
        )}
        {market.volume24h !== null && <Stat label={t('stats.volume')}>{f.usdCompact(market.volume24h)}</Stat>}
        {market.volumeVsUsual !== null && (
          <Stat label={t('stats.volumeVsUsual')} hint={t('stats.usualHint')}>
            {times(market.volumeVsUsual)}
          </Stat>
        )}
        {market.swingsVsUsual !== null && (
          <Stat label={t('stats.swingsVsUsual')} hint={t('stats.usualHint')}>
            {times(market.swingsVsUsual)}
          </Stat>
        )}
        {market.funding !== null && (
          <Stat label={t('stats.funding')}>
            <Numeral tone="direction" direction={directionOf(market.funding, FUNDING_DIGITS)}>
              {f.change(market.funding, FUNDING_DIGITS)}
            </Numeral>
          </Stat>
        )}
        {market.openInterest !== null && (
          <Stat label={t('stats.openInterest')}>{f.usdCompact(market.openInterest)}</Stat>
        )}
      </dl>
      <Button asChild variant="secondary" className="max-sm:w-full">
        <Link {...topicLink(market.key)}>
          <MessageCircle aria-hidden />
          {t('discuss')}
        </Link>
      </Button>
    </section>
  );
}

function Stat({
  label,
  hint,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5" title={hint}>
      <dt className="whitespace-nowrap text-meta text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap font-figure text-foreground text-row">{children}</dd>
    </div>
  );
}
