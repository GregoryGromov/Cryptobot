import type {
  Chat,
  ChatProposal,
  ForecastNote,
  HorizonNote,
  MarketName,
  SignalView,
} from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { Separator } from '@reinforce/ui-react/separator';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { PanelBottom, PanelRight } from 'lucide-react';
import { match } from 'ts-pattern';
import { dealLevels, dealPhase } from '~/contexts/trading/domain/deal-phase';
import { DealFlat } from '~/contexts/trading/ui/deal-flat';
import { DealPart } from '~/contexts/trading/ui/deal-part';
import { useServerNow } from '~/shared/api/live';
import { useTradingMode } from '~/shared/api/trading-mode';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { waitKey } from '~/shared/ui/wait-handoff';
import { useFanCandles } from '../api/queries';
import { invalidationCrossed, isLive, onTerm, progressOf } from '../domain/episode-vm';
import { leanOf, leanWords } from '../domain/verdict';
import { EpisodeHead, SignalFact } from './episode-head';
import { unscoredWords } from './forecast-words';
import { HorizonStrip } from './horizon-strip';
import { LeanTicks } from './lean-ticks';
import { SignalChart } from './signal-chart';
import { useGrowFromWait } from './use-grow-from-wait';
import { useInView } from './use-in-view';
import { WorkLog } from './work-log';

export const forecastAnchorId = (forecastId: string): string => `forecast-${forecastId}`;

const NOW_TICK_MS = 15_000;

/** Where the conversation's own chart has taken this card's chart to, and how to bring it back. */
export type ChartAway = { readonly where: 'beside' | 'sheet'; readonly onReturn: () => void };

export function EpisodeCard({
  forecast,
  signal,
  market,
  open,
  onToggle,
  proposal = null,
  topic = null,
  chartAway = null,
  onOpenChart = null,
}: {
  readonly forecast: ForecastNote;
  readonly signal: SignalView | null;
  readonly market: MarketName;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly record: Chat['record'];
  /** The trade the broker offers on this forecast; the card then shows it on the chart and under it. */
  readonly proposal?: ChatProposal | null;
  readonly topic?: string | null;
  /** Set while the conversation's chart draws this forecast: the card's own chart folds away. */
  readonly chartAway?: ChartAway | null;
  /** Opens the conversation's own, larger chart on this forecast; no such button when absent. */
  readonly onOpenChart?: (() => void) | null;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const now = useServerNow(NOW_TICK_MS);
  const { ref: cardRef, node: card, visible } = useInView<HTMLElement>();
  useGrowFromWait(card, waitKey(forecast.coin, forecast.t0));
  const shown = onTerm(forecast, useTradingMode().horizon);
  const [only] = shown.horizons.length === 1 ? shown.horizons : [];
  const live = isLive(shown);
  const chart = useFanCandles(forecast.threadId, live, visible);
  const candles = chart.data?.candles ?? [];
  const unscored = unscoredWords(forecast.cohort, format);
  const levels = proposal ? dealLevels(dealPhase(proposal, now)) : null;
  return (
    <article
      ref={cardRef}
      aria-label={t('card.label', { name: market.name })}
      className={cn(cardVariants({ size: 'sm' }), 'gap-5 px-4 sm:px-5', signal && 'signal-beam')}
    >
      <SignalFact
        head={
          <EpisodeHead
            market={market}
            price={live ? (candles.at(-1)?.c ?? forecast.p0) : forecast.p0}
            tag={unscored}
          />
        }
        signal={signal}
        forecast={forecast}
        offer={proposal !== null && topic !== null}
      />
      <div>
        <div
          inert={chartAway !== null}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            chartAway ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <AppBoundary tier="panel" scope="forecast-chart">
              <SignalChart
                forecast={shown}
                market={market}
                minutes={match(chart)
                  .with({ isError: true }, () => ({ kind: 'failed' as const }))
                  .with({ isPending: true }, () => ({ kind: 'loading' as const }))
                  .otherwise(() => ({ kind: 'ready' as const, candles }))}
                levels={levels && { stop: levels.stop, entry: levels.entry, take: levels.take }}
                signal={signal}
                onExpand={onOpenChart}
              />
            </AppBoundary>
          </div>
        </div>
        {chartAway && <ChartAwayLine away={chartAway} />}
      </div>
      <div className="flex flex-col gap-3">
        {only ? (
          <Verdict forecast={shown} horizon={only} now={now} />
        ) : (
          <div className="flex flex-col gap-3">
            <Heading as="h3" size="section">
              {forecast.headline}
            </Heading>
            <HorizonStrip forecast={shown} now={now} aside={<ProgressLine forecast={shown} now={now} />} />
            <p className="text-foreground-soft text-row">{forecast.thesis}</p>
          </div>
        )}
        {unscored && <p className="-mt-1 text-meta text-muted-foreground sm:hidden">{unscored}</p>}
        <WorkLog
          forecast={shown}
          market={market}
          crossed={invalidationCrossed(shown, candles, now)}
          open={open}
          onToggle={onToggle}
          active={visible}
        />
      </div>
      {proposal && topic !== null && (
        <>
          <Separator />
          <AppBoundary tier="panel" scope="proposal">
            <DealPart proposal={proposal} marketName={market.name} topic={topic} />
          </AppBoundary>
        </>
      )}
      {forecast.plan.action === 'FLAT' && (
        <>
          <Separator />
          <DealFlat horizon={forecast.plan.horizon} />
        </>
      )}
    </article>
  );
}

function ChartAwayLine({ away }: { readonly away: ChartAway }) {
  const { t } = useT('forecast');
  const Icon = away.where === 'beside' ? PanelRight : PanelBottom;
  return (
    <p className="motion-safe:fade-in flex items-center gap-2 text-meta text-muted-foreground motion-safe:animate-in motion-safe:duration-300">
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{t(`signal.chart.away.${away.where}`)}</span>
      <Button variant="ghost" size="sm" className="-me-2 shrink-0" onClick={away.onReturn}>
        {t('signal.chart.back')}
      </Button>
    </p>
  );
}

function Verdict({
  forecast,
  horizon,
  now,
}: {
  readonly forecast: ForecastNote;
  readonly horizon: HorizonNote;
  readonly now: number;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const lean = leanOf(horizon.probs);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <Heading as="h3" size="section">
          {leanWords(format, horizon.probs)}
        </Heading>
        {lean && (
          <span className="flex items-center gap-2.5">
            <LeanTicks probs={horizon.probs} lead={lean.cls} />
            <span className="font-figure font-semibold text-foreground text-row">
              {t('lean.tenths', { n: lean.tenths })}
            </span>
          </span>
        )}
        <span className="ms-auto text-meta">
          <ProgressLine forecast={forecast} now={now} />
        </span>
      </div>
      <p className="text-foreground-soft text-row">{forecast.thesis}</p>
    </div>
  );
}

function ProgressLine({ forecast, now }: { readonly forecast: ForecastNote; readonly now: number }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  return (
    <span className="text-muted-foreground text-xs">
      {match(progressOf(forecast, now))
        .with({ kind: 'next' }, (p) => t('progress.next', { time: fmt.clock(p.at) }))
        .with({ kind: 'checking' }, (p) => t('progress.checking', { time: fmt.clock(p.at) }))
        .with({ kind: 'done' }, (p) => t('progress.done', { hits: p.hits, n: p.n }))
        .with({ kind: 'hit' }, () => t('progress.hit'))
        .with({ kind: 'miss' }, () => t('progress.miss'))
        .with({ kind: 'over' }, () => t('progress.over'))
        .exhaustive()}
    </span>
  );
}
