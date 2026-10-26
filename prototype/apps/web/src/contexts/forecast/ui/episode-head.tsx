import type { ForecastNote, MarketName, SignalView } from '@reinforce/server/dto';
import { Clock, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { timesOf } from '~/contexts/signals/domain/waves';
import { SignalSpark } from '~/contexts/signals/ui/signal-spark';
import { useTradingMode } from '~/shared/api/trading-mode';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { horizonWords } from '../domain/verdict';

export function EpisodeHead({
  market,
  price = null,
  tag = null,
}: {
  readonly market: MarketName;
  readonly price?: number | null;
  readonly tag?: string | null;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const { t: settings } = useT('settings');
  const fmt = useFormatters();
  const { mode, horizon } = useTradingMode();
  return (
    <header className="flex items-center gap-3">
      <CoinLogo coin={market.coin} ticker={market.ticker} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-foreground text-row">{market.name}</span>
        <span className="truncate text-meta text-muted-foreground">
          {t('signal.mode', { mode: settings(`broker.modes.${mode}`), term: horizonWords(format, horizon) })}
        </span>
      </div>
      {tag && (
        <span className="shrink-0 rounded-full border border-foreground/14 px-2.5 py-0.5 text-muted-foreground text-xs max-sm:hidden">
          {tag}
        </span>
      )}
      {price !== null && (
        <Numeral weight="semibold" className="shrink-0 text-lg leading-6 tracking-tight">
          {fmt.price(price)}
        </Numeral>
      )}
    </header>
  );
}

/** The market's head and the signal that started the analysis, as Reinforce caught it. */
export function SignalFact({
  head,
  signal,
  forecast,
  offer,
}: {
  readonly head: ReactNode;
  readonly signal: SignalView | null;
  readonly forecast: Pick<ForecastNote, 'at'>;
  readonly offer: boolean;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const { t: words } = useT('signals');
  const fmt = useFormatters();
  if (!signal)
    return (
      <>
        {head}
        <p className="flex items-center gap-2 text-meta text-muted-foreground">
          <Clock aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
          {t('card.made', { time: fmt.clock(forecast.at) })}
        </p>
      </>
    );
  const times = timesOf(signal);
  return (
    <>
      {head}
      <section aria-label={t('signal.source')} className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 font-medium text-[0.6875rem] text-foreground-soft uppercase tracking-[0.14em]">
          <Zap aria-hidden className="size-3.5 fill-current text-warning" strokeWidth={2} />
          {t('signal.source')}
          <span className="font-figure font-normal text-muted-foreground tracking-[0.04em]">
            · {fmt.clock(signal.eventAt)}
          </span>
        </p>
        <div className="flex items-end gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5">
          <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="flex items-baseline gap-2">
              <Numeral
                tone="direction"
                direction={directionOf(signal.move, 2)}
                weight="semibold"
                className="text-[2.125rem] leading-[2.375rem] tracking-[-0.03em]"
              >
                {fmt.move(signal.move)}
              </Numeral>
              <span className="whitespace-nowrap text-muted-foreground text-sm">
                {t('signal.move', {
                  head: words(`head.${signal.direction}`),
                  horizon: horizonWords(format, signal.horizon),
                })}
              </span>
            </span>
            {times !== null && (
              <span className="flex items-baseline gap-2">
                <Numeral weight="semibold" className="text-[2.125rem] leading-[2.375rem] tracking-[-0.03em]">
                  {t('signal.times', { n: times })}
                </Numeral>
                <span className="whitespace-nowrap text-muted-foreground text-sm">{t('signal.usual')}</span>
              </span>
            )}
          </p>
          {signal.spark && (
            <span className="block w-full shrink-0 sm:w-42">
              <SignalSpark spark={signal.spark} direction={signal.direction} size="wide" decorative />
            </span>
          )}
        </div>
        <p className="text-meta text-muted-foreground">
          {t(offer ? 'signal.after.offer' : 'signal.after.plain')}
        </p>
      </section>
    </>
  );
}
