import type { AnalysisProgress, Figure, MarketName, Probs } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { match } from 'ts-pattern';
import { candlesMini, type MiniFigure as Mini, miniFigure } from '~/contexts/forecast/domain/mini-vm';
import { leanOf } from '~/contexts/forecast/domain/verdict';
import { MiniShape } from '~/contexts/forecast/ui/figures/mini-figure';
import { LeanTicks } from '~/contexts/forecast/ui/lean-ticks';
import { SideArrow } from '~/contexts/trading/ui/side-button';
import { useServerNow } from '~/shared/api/live';
import { useTradingMode } from '~/shared/api/trading-mode';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useStopwatch } from '~/shared/hooks/use-stopwatch';
import { useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { leaveWait, waitKey } from '~/shared/ui/wait-handoff';
import type { Pending } from '../domain/chat-types';
import { type MarketRead, marketRead } from '../domain/market-read';
import { type StepState, type WaitStep, waitSteps } from '../domain/wait-steps';
import { clockOf, waitView } from '../domain/waiting';

const WAIT_TICK_MS = 500;

const RSI_SCALE = {
  kind: 'scale',
  min: 0,
  max: 100,
  zones: [
    { from: 0, to: 30, tone: 'down' },
    { from: 70, to: 100, tone: 'up' },
  ],
  range: null,
  ends: null,
} as const;

const enterClass = 'motion-safe:fade-in motion-safe:animate-in motion-safe:duration-500';
const figureEnterClass = 'motion-safe:animate-[reveal-right_900ms_var(--ease-emphasized)_both]';
const stepEnterClass = 'motion-safe:animate-[step-in_700ms_var(--ease-emphasized)_both]';

/** A step the broker has got to: the one he is on, or one behind him. */
type Reached = Exclude<StepState, 'pending'>;

const nodeClass = (state: Reached): string =>
  match(state)
    .with('done', () => 'ring-chart-1/20')
    .with('active', () => 'node-breathe ring-chart-1/25')
    .exhaustive();

const labelClass = (state: Reached): string =>
  match(state)
    .with('done', () => 'text-foreground-soft')
    .with('active', () => 'step-shimmer motion-reduce:text-foreground')
    .exhaustive();

type Shown = { readonly value: ReactNode; readonly figure: ReactNode };

const NOTHING: Shown = { value: null, figure: null };

const mini = (shape: Mini | null): ReactNode => shape && <MiniShape mini={shape} className="w-20" />;

const figureOf = (figure: Figure): ReactNode => mini(miniFigure(figure));

function useShown(read: MarketRead, progress: AnalysisProgress | null, drafted: Probs | null) {
  const { t } = useT('conversation');
  const { t: words } = useT('forecast');
  const { t: format } = useT('format');
  const f = useFormatters();
  return (step: WaitStep): Shown =>
    match(step)
      .with('price', () => ({
        value: read.hour !== null && (
          <Numeral tone="direction" direction={directionOf(read.hour, 2)}>
            {t('wait.read.hour', { change: f.change(read.hour, 2) })}
          </Numeral>
        ),
        figure: mini(candlesMini(read.closes)),
      }))
      .with('volume', () =>
        read.volume === null
          ? NOTHING
          : {
              value: t('wait.read.volume', { ratio: f.decimal(read.volume, 1) }),
              figure: figureOf({ kind: 'ratio', value: read.volume }),
            },
      )
      .with('indicators', () =>
        read.rsi === null
          ? NOTHING
          : {
              value: t('wait.read.rsi', { value: f.int(read.rsi) }),
              figure: figureOf({
                ...RSI_SCALE,
                zones: [...RSI_SCALE.zones],
                trail: [{ label: '', value: read.rsi }],
              }),
            },
      )
      .with('odds', () => {
        if (!drafted) return NOTHING;
        const lean = leanOf(drafted);
        return {
          value: lean
            ? words('lean.odds', { outcome: words(`lean.${lean.cls}`), n: lean.tenths })
            : words('lean.none'),
          figure: lean && <LeanTicks probs={drafted} lead={lean.cls} />,
        };
      })
      .with('plan', () =>
        match(progress?.plan?.action ?? null)
          .with(null, () => NOTHING)
          .with('FLAT', () => ({ value: t('wait.flat'), figure: null }))
          .with('LONG', 'SHORT', (side) => ({
            value: (
              <span
                className={cn('inline-flex items-center gap-1', side === 'LONG' ? 'text-up' : 'text-down')}
              >
                <SideArrow side={side} className="size-3.5" />
                {format(`side.${side}`)}
              </span>
            ),
            figure: null,
          }))
          .exhaustive(),
      )
      .with('markets', 'reasons', () => NOTHING)
      .exhaustive();
}

function StepRow({
  step,
  state,
  shown,
}: {
  readonly step: WaitStep;
  readonly state: Reached;
  readonly shown: Shown;
}) {
  const { t } = useT('conversation');
  return (
    <li aria-current={state === 'active' ? 'step' : undefined} className={cn('grid', stepEnterClass)}>
      <div className="min-h-0 overflow-hidden">
        <div className="grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 py-1.5 pe-2">
          <span aria-hidden className="relative flex justify-center">
            <span
              className={cn(
                'relative size-2.25 rounded-full bg-chart-1 ring-3 transition-colors duration-300',
                nodeClass(state),
              )}
            />
          </span>
          <span className={cn('min-w-0 text-sm transition-colors duration-300', labelClass(state))}>
            {t(`wait.steps.${step}.${state === 'done' ? 'done' : 'doing'}`)}
          </span>
          <span className="grid justify-items-end gap-y-0.5 sm:grid-cols-[5.5rem_auto] sm:items-center sm:gap-x-3.5">
            <span aria-hidden className="flex justify-end max-sm:hidden">
              {shown.figure && <span className={figureEnterClass}>{shown.figure}</span>}
            </span>
            <span
              aria-hidden={state !== 'done'}
              className={cn(
                'grid transition-[grid-template-columns,opacity] duration-700 ease-(--ease-emphasized) motion-reduce:transition-none',
                state === 'done' ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0',
              )}
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap font-figure font-medium text-foreground text-sm">
                {shown.value}
              </span>
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

/** An analysis on its way: what the broker does, each step coming in as he starts it, with its number once he has it. */
export function AnalysisWait({
  run,
  market,
  progress,
}: {
  readonly run: Pending;
  readonly market: MarketName | null;
  readonly progress: AnalysisProgress | null;
}) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const locale = useLocale();
  const now = useServerNow(WAIT_TICK_MS);
  const { horizon: term } = useTradingMode();
  const drafted = progress?.odds.find((odds) => odds.horizon === term)?.probs ?? null;
  const view = waitView(run, now);
  const clock = clockOf(useStopwatch(run.since, now));
  const chart = useQuery({
    ...trpc.views.marketChart.queryOptions({ coin: market?.coin ?? '' }),
    enabled: market !== null,
    staleTime: 30_000,
    meta: { silent: true },
  });
  const read = marketRead(chart.data ?? []);
  const shownOf = useShown(read, progress, drafted);
  const steps = waitSteps(progress?.stage ?? 'reading', now - run.since).flatMap(({ step, state }) =>
    state === 'pending' ? [] : [{ step, state }],
  );
  const active = steps.find(({ state }) => state === 'active');
  const price = chart.data?.at(-1)?.c ?? null;
  const name = market ? inSentence(market.name, locale) : t('wait.market');
  const card = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const key = market && run.t0 !== null ? waitKey(market.coin, run.t0) : null;
  useLayoutEffect(() => {
    const article = card.current;
    const steps = list.current;
    if (!key || !article || !steps) return;
    return () => leaveWait(key, { steps, height: article.offsetHeight });
  }, [key]);
  return (
    <article
      ref={card}
      aria-label={t('wait.forecast', { name })}
      aria-busy
      className={cn(cardVariants({ size: 'sm' }), 'signal-beam w-full gap-4 px-4 sm:px-5')}
    >
      <header className="flex items-center gap-3">
        {market && <CoinLogo coin={market.coin} ticker={market.ticker} size="lg" />}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-foreground text-row">
            {market?.name ?? t('wait.market')}
          </span>
          {clock !== null && (
            <span aria-hidden className="font-figure text-meta text-muted-foreground tabular-nums">
              {f.elapsed(clock)}
            </span>
          )}
        </div>
        {price !== null && (
          <Numeral weight="semibold" className="text-lg leading-6 tracking-tight">
            {f.price(price)}
          </Numeral>
        )}
      </header>
      <span aria-live="polite" className="sr-only">
        {active && t(`wait.steps.${active.step}.doing`)}
      </span>
      <ol
        ref={list}
        aria-label={t('wait.steps.label')}
        className="relative flex flex-col before:absolute before:start-3.5 before:top-5.5 before:bottom-5.5 before:w-px before:bg-chart-1/50"
      >
        {steps.map(({ step, state }) => (
          <StepRow key={step} step={step} state={state} shown={shownOf(step)} />
        ))}
      </ol>
      {progress?.thesis && (
        <p className={cn('text-foreground-soft text-row', enterClass)}>{progress.thesis}</p>
      )}
      {(view.retry || view.deadline !== null) && (
        <p className="flex flex-wrap gap-x-3 text-muted-foreground text-xs">
          {view.retry && <span>{t('wait.retry')}</span>}
          {view.deadline !== null && <span>{t('wait.until', { time: f.clock(view.deadline + 1000) })}</span>}
        </p>
      )}
    </article>
  );
}
