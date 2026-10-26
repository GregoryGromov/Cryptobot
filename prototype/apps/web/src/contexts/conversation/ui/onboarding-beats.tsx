import type { Estimate, Figure } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowDownRight, Check, FastForward, Sparkle } from 'lucide-react';
import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { agoWords, horizonWords, leanWords } from '~/contexts/forecast/domain/verdict';
import { MiniFigure } from '~/contexts/forecast/ui/figures/mini-figure';
import { LeanTicks } from '~/contexts/forecast/ui/lean-ticks';
import { SignalSpark } from '~/contexts/signals/ui/signal-spark';
import { DealScale } from '~/contexts/trading/ui/deal-scale';
import { SideArrow } from '~/contexts/trading/ui/side-button';
import { useServerNow } from '~/shared/api/live';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { plainWords } from '../domain/broker-words';
import { DEMO, DEMO_BEFORE, DEMO_GAIN, DEMO_LOSS, priceAt, shortResult, type TourBeat } from '../domain/tour';
import { BrokerWords } from './broker-words';
import { brokerTextClass, enterClass } from './feed-classes';
import { TourFan, TourRace } from './onboarding-charts';
import { Writing } from './writing';

/** When a beat's last piece has landed, in ms after it starts: the composer then types the next question. */
export const LANDS: Record<TourBeat, number> = {
  signal: 1300,
  forecast: 5600,
  why: 2900,
  risk: 2700,
  open: 1900,
  payoff: 5700,
};

const THINK_FROM = 450;
const NOW_TICK_MS = 60_000;
const RACE = { from: 500, ms: 3600 } as const;
const COIN = { coin: DEMO.coin, ticker: DEMO.coin } as const;

const cardClass = cn(cardVariants({ size: 'sm' }), 'w-full');

const price = (closes: readonly number[], span: number): Figure => ({
  kind: 'price',
  startAt: 0,
  closes: [...closes],
  volumes: null,
  usualVolume: null,
  volumeTimes: null,
  span,
  levels: [],
});

function In({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return <div className={cn('w-full', enterClass, className)}>{children}</div>;
}

function Thinking() {
  const { t } = useT('conversation');
  return (
    <div className={cn(brokerTextClass, 'flex items-center gap-2.5', enterClass)}>
      <Sparkle
        aria-hidden
        strokeWidth={0}
        className="thought-twinkle size-4.5 shrink-0 fill-current text-primary"
      />
      <span className="thought-shimmer font-semibold">{t('wait.thinking')}</span>
    </div>
  );
}

/** The broker's words: written out word by word while the beat plays, whole once it has passed. */
function Words({ text, live }: { readonly text: string; readonly live: boolean }) {
  if (!live)
    return (
      <div className={brokerTextClass}>
        <BrokerWords text={text} live={false} />
      </div>
    );
  return (
    <>
      <span className="sr-only">{plainWords(text)}</span>
      <Writing text={text} at={0} whole />
    </>
  );
}

/** Thinking until `answerAt`, then what the broker answers. */
function Answer({
  ms,
  answerAt,
  children,
}: {
  readonly ms: number;
  readonly answerAt: number;
  readonly children: ReactNode;
}) {
  if (ms < THINK_FROM) return null;
  if (ms < answerAt) return <Thinking />;
  return <div className="flex w-full flex-col items-start gap-3">{children}</div>;
}

const SIGNAL_SPARK = {
  before: DEMO_BEFORE.length,
  after: 3,
  values: [...DEMO_BEFORE],
  at: DEMO_BEFORE.length - 1,
};

const COUNT = { from: 850, ms: 450 } as const;

/** The signal as the home screen lists it, coming in: the plate lights up, the line draws, the fall counts up. */
function SignalBeat({ ms }: { readonly ms: number }) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const f = useFormatters();
  const now = useServerNow(NOW_TICK_MS);
  if (ms < 150) return null;
  const counted = Math.min(1, Math.max(0, (ms - COUNT.from) / COUNT.ms));
  return (
    <In className="@container">
      <section
        aria-label={t('label')}
        className="flex min-h-12.5 w-full items-center gap-3 rounded-(--radius) bg-foreground/4 py-2.5 ps-2.5 pe-3 font-medium text-foreground text-row motion-safe:animate-[plate-arrive_1800ms_ease-out_backwards] max-sm:pe-2.5"
      >
        <CoinLogo {...COIN} size="sm" className="size-5.5" />
        <span className="min-w-0 flex-1">
          <span className="sr-only">
            {t('live.DOWN', {
              name: DEMO.coin,
              move: f.percent(DEMO.signalMove, 2),
              horizon: horizonWords(format, DEMO.horizon),
              times: t('times', { count: DEMO.signalTimes }),
            }).replace(/<[^>]+>/g, '')}
          </span>
          <span aria-hidden className="block @2xl:truncate">
            <Trans
              t={t}
              i18nKey="live.DOWN"
              values={{
                name: DEMO.coin,
                move: f.percent(DEMO.signalMove * counted, 2),
                horizon: horizonWords(format, DEMO.horizon).replaceAll(' ', '\u00A0'),
                times: t('times', { count: DEMO.signalTimes }),
              }}
              components={{
                b: <b className="font-semibold" />,
                move: <span className="font-figure text-down tabular-nums" />,
                more: <span className="@max-2xl:hidden" />,
              }}
            />
          </span>
        </span>
        <span className="@max-2xl:hidden motion-safe:animate-[reveal-right_900ms_var(--ease-emphasized)_300ms_both]">
          <SignalSpark spark={SIGNAL_SPARK} direction="DOWN" size="line" plain decorative />
        </span>
        <span className="flex @2xl:min-w-24 shrink-0 items-center justify-end whitespace-nowrap font-figure font-normal text-meta text-muted-foreground">
          <span
            aria-hidden
            className="me-2 size-2 rounded-full bg-up ring-[3px] ring-up/20 motion-safe:animate-[status-dot-pulse_2.6s_ease-in-out_infinite]"
          />
          {agoWords(format, f.duration, now, now)}
        </span>
      </section>
    </In>
  );
}

const STEPS = [
  { step: 'price', from: 900, done: 1700 },
  { step: 'volume', from: 1700, done: 2500 },
  { step: 'odds', from: 2500, done: 3300 },
] as const;

type Step = (typeof STEPS)[number]['step'];

const VERDICT_AT = 3500;

function StepRow({ step, done }: { readonly step: Step; readonly done: boolean }) {
  const { t } = useT('conversation');
  const { t: words } = useT('forecast');
  const f = useFormatters();
  const shown = match(step)
    .with('price', () => ({
      value: (
        <Numeral tone="direction" direction="down">
          {t('wait.read.hour', { change: f.change(DEMO.hourChange, 1) })}
        </Numeral>
      ),
      figure: <MiniFigure figure={price(DEMO_BEFORE, 5)} className="w-20" />,
    }))
    .with('volume', () => ({
      value: t('wait.read.volume', { ratio: f.decimal(DEMO.volume, 1) }),
      figure: <MiniFigure figure={{ kind: 'ratio', value: DEMO.volume }} className="w-20" />,
    }))
    .with('odds', () => ({
      value: words('lean.odds', { outcome: words('lean.DOWN'), n: 7 }),
      figure: <LeanTicks probs={DEMO.odds} lead="DOWN" />,
    }))
    .exhaustive();
  return (
    <li
      aria-current={done ? undefined : 'step'}
      className="grid motion-safe:animate-[step-in_700ms_var(--ease-emphasized)_both]"
    >
      <div className="min-h-0 overflow-hidden">
        <div className="grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 py-1.5 pe-1">
          <span aria-hidden className="flex justify-center">
            <span
              className={cn(
                'size-2.25 rounded-full bg-chart-1 ring-3',
                done ? 'ring-chart-1/20' : 'node-breathe ring-chart-1/25',
              )}
            />
          </span>
          <span className={cn('min-w-0 text-sm', done ? 'text-foreground-soft' : 'step-shimmer')}>
            {t(`wait.steps.${step}.${done ? 'done' : 'doing'}`)}
          </span>
          {done && (
            <span className="motion-safe:fade-in flex items-center gap-3.5 motion-safe:animate-in motion-safe:duration-500">
              <span aria-hidden className="max-sm:hidden">
                {shown.figure}
              </span>
              <span className="whitespace-nowrap font-figure font-medium text-foreground text-sm">
                {shown.value}
              </span>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function ForecastBeat({ ms, live }: { readonly ms: number; readonly live: boolean }) {
  const { t } = useT('conversation');
  const { t: words } = useT('forecast');
  const { t: format } = useT('format');
  const f = useFormatters();
  if (ms < THINK_FROM) return null;
  const reading = ms < VERDICT_AT;
  return (
    <In>
      <article aria-busy={reading} className={cn(cardClass, 'signal-beam gap-4 px-4 sm:px-5')}>
        <header className="flex items-center gap-3">
          <CoinLogo {...COIN} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold text-foreground text-row">{DEMO.coin}</span>
            <span className={cn('text-meta', reading ? 'thought-shimmer' : 'text-muted-foreground')}>
              {reading
                ? t('wait.forecast', { name: DEMO.coin })
                : t('onboarding.forecast.on', { term: horizonWords(format, DEMO.horizon) })}
            </span>
          </div>
          <Numeral weight="semibold" className="text-lg leading-6 tracking-tight">
            {f.price(DEMO.entry)}
          </Numeral>
        </header>
        <ol
          aria-label={t('wait.steps.label')}
          className="relative flex flex-col before:absolute before:start-3.5 before:top-5.5 before:bottom-5.5 before:w-px before:bg-chart-1/50"
        >
          {STEPS.filter(({ from }) => ms >= from).map(({ step, done }) => (
            <StepRow key={step} step={step} done={ms >= done} />
          ))}
        </ol>
        {!reading && (
          <div className={cn('flex flex-col gap-3 border-foreground/7 border-t pt-4', enterClass)}>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <Heading as="h3" size="section">
                {leanWords(format, DEMO.odds)}
              </Heading>
              <span className="flex items-center gap-2.5">
                <LeanTicks probs={DEMO.odds} lead="DOWN" />
                <span className="font-figure font-semibold text-foreground text-row">
                  {words('lean.tenths', { n: 7 })}
                </span>
              </span>
              <span className="ms-auto inline-flex h-6 items-center gap-1.5 rounded-full border border-foreground/14 px-2.5 text-foreground-soft text-xs">
                <ArrowDownRight aria-hidden className="size-3 text-down" strokeWidth={2.2} />
                {horizonWords(format, DEMO.horizon)}
              </span>
            </div>
            <TourFan />
            {ms >= VERDICT_AT + 900 && (
              <div className="-mx-1">
                <Words
                  live={live}
                  text={t('onboarding.forecast.say', { count: DEMO.horizon, take: f.price(DEMO.take) })}
                />
              </div>
            )}
          </div>
        )}
      </article>
    </In>
  );
}

const POINTS = [
  { key: 'volume', at: 1650, figure: { kind: 'ratio', value: DEMO.volume } },
  { key: 'floor', at: 1900, figure: price(DEMO_BEFORE, 5) },
  {
    key: 'market',
    at: 2150,
    figure: {
      kind: 'compare',
      rows: [
        { label: 'BTC', coin: 'BTC', value: -1.2, own: true },
        { label: 'ETH', coin: 'ETH', value: -0.9, own: false },
        { label: 'SOL', coin: 'SOL', value: -1.4, own: false },
      ],
    },
  },
] as const satisfies readonly { key: string; at: number; figure: Figure }[];

function WhyBeat({ ms, live }: { readonly ms: number; readonly live: boolean }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const values = {
    volume: `×${f.decimal(DEMO.volume, 1)}`,
    floor: f.change(DEMO.hourChange, 1),
    market: null,
  } as const;
  return (
    <Answer ms={ms} answerAt={1300}>
      <Words live={live} text={t('onboarding.why.say')} />
      <ul className="flex w-full flex-col gap-1.5">
        {POINTS.filter(({ at }) => ms >= at).map((point) => (
          <li
            key={point.key}
            className={cn(
              'grid min-h-12.5 grid-cols-[0.875rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-(--radius) bg-foreground/4 py-2.5 ps-3.5 pe-3',
              enterClass,
            )}
          >
            <ArrowDownRight aria-hidden className="size-3.5 text-down" strokeWidth={2} />
            <span className="text-foreground text-row">{t(`onboarding.why.${point.key}`)}</span>
            <span className="flex items-center gap-3.5">
              <MiniFigure figure={point.figure} className="w-20 max-sm:hidden" />
              <span className="w-12 text-end font-figure text-foreground text-sm">{values[point.key]}</span>
            </span>
          </li>
        ))}
      </ul>
    </Answer>
  );
}

const ESTIMATE: Estimate = {
  price: DEMO.entry,
  entryPrice: DEMO.entry,
  slippageBps: 0,
  entryFee: 0,
  roundTripFee: 0,
  stopPrice: DEMO.stop,
  takePrice: DEMO.take,
  entryAt: 0,
  exitBy: 0,
  lossAtStop: DEMO_LOSS,
  gainAtTake: DEMO_GAIN,
};

function RiskBeat({ ms, live }: { readonly ms: number; readonly live: boolean }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  return (
    <Answer ms={ms} answerAt={1100}>
      <Words
        live={live}
        text={t('onboarding.risk.say', { stop: f.price(DEMO.stop), loss: f.usd(DEMO_LOSS) })}
      />
      {ms >= 1700 && (
        <In className="max-w-[30rem]">
          <div className={cn(cardClass, 'px-4 py-4')}>
            <DealScale
              levels={{ stop: DEMO.stop, entry: DEMO.entry, take: DEMO.take, now: null }}
              estimate={ESTIMATE}
              settled={false}
            />
          </div>
        </In>
      )}
    </Answer>
  );
}

function OpenBeat({ ms }: { readonly ms: number }) {
  const { t } = useT('conversation');
  const { t: format } = useT('format');
  const f = useFormatters();
  return (
    <Answer ms={ms} answerAt={1000}>
      <In className="max-w-[30rem]">
        <section className={cn(cardClass, 'flex-row items-center gap-3 px-4 py-3.5')}>
          <span
            aria-hidden
            className="grid size-8.5 shrink-0 place-items-center rounded-full bg-foreground/6 ring-1 ring-foreground/12 ring-inset"
          >
            <Check
              className="motion-safe:zoom-in-50 size-4 fill-mode-both text-foreground motion-safe:animate-in motion-safe:delay-150 motion-safe:duration-300"
              strokeWidth={2.6}
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-semibold text-foreground text-row">{t('onboarding.opened.done')}</p>
            <p className="text-meta text-muted-foreground">
              <span className="me-1 inline-flex items-center gap-0.5 font-medium text-down">
                <SideArrow side="SHORT" className="size-3.5" />
                {format('side.SHORT')}
              </span>
              {t('onboarding.opened.terms', {
                coin: DEMO.coin,
                entry: f.price(DEMO.entry),
                term: horizonWords(format, DEMO.horizon),
              })}
            </p>
          </div>
          <Numeral weight="semibold" className="shrink-0 text-lg leading-6">
            {f.usdWhole(DEMO.amount)}
          </Numeral>
        </section>
      </In>
    </Answer>
  );
}

function PayoffBeat({ ms, live }: { readonly ms: number; readonly live: boolean }) {
  const { t } = useT('conversation');
  const { t: format } = useT('format');
  const f = useFormatters();
  const share = Math.min(1, Math.max(0, (ms - RACE.from) / RACE.ms));
  const closed = share >= 1;
  const result = shortResult(DEMO.amount, DEMO.entry, priceAt(share));
  const seconds = Math.floor(share * DEMO.closedAfter);
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <In>
        <article className={cn(cardClass, 'gap-4 px-4 sm:px-5')}>
          <header className="flex items-center gap-3">
            <CoinLogo {...COIN} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 font-semibold text-foreground text-row">
                <span className="inline-flex items-center gap-0.5 text-down">
                  <SideArrow side="SHORT" className="size-4" />
                  {format('side.SHORT')}
                </span>
                · {DEMO.coin}
              </span>
              <span className="flex items-center gap-1.5 text-meta text-muted-foreground">
                {closed ? (
                  <Check aria-hidden className="size-3.5 text-up" strokeWidth={2.4} />
                ) : (
                  <FastForward aria-hidden className="size-3.5 fill-current" strokeWidth={0} />
                )}
                {closed
                  ? t('onboarding.race.closed', { time: f.elapsed(DEMO.closedAfter) })
                  : t('onboarding.race.running')}
              </span>
            </div>
            <Numeral
              key={closed ? 'closed' : 'running'}
              tone="direction"
              direction={directionOf(result, 2)}
              weight="semibold"
              className={cn(
                'text-xl leading-7 tracking-tight',
                closed && 'motion-safe:zoom-in-90 motion-safe:animate-in motion-safe:duration-300',
              )}
            >
              {f.usdSigned(result)}
            </Numeral>
          </header>
          <TourRace share={share} />
          <div className="flex items-center gap-3 text-meta">
            <span className="w-24 font-figure text-foreground tabular-nums">{f.elapsed(seconds)}</span>
            <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-foreground/8">
              <span
                className="absolute inset-y-0 start-0 rounded-full bg-foreground/55"
                style={{ width: `${(seconds / (DEMO.horizon * 60)) * 100}%` }}
              />
            </span>
            <span className="text-muted-foreground">{horizonWords(format, DEMO.horizon)}</span>
          </div>
        </article>
      </In>
      {ms >= RACE.from + RACE.ms + 500 && (
        <Words live={live} text={t('onboarding.payoff.say', { gain: f.usd(DEMO_GAIN) })} />
      )}
    </div>
  );
}

/** What the broker shows in a beat, `ms` into it; a beat already passed stands whole. */
export function BeatBody({ beat, ms }: { readonly beat: TourBeat; readonly ms: number }) {
  const live = Number.isFinite(ms);
  return match(beat)
    .with('signal', () => <SignalBeat ms={ms} />)
    .with('forecast', () => <ForecastBeat ms={ms} live={live} />)
    .with('why', () => <WhyBeat ms={ms} live={live} />)
    .with('risk', () => <RiskBeat ms={ms} live={live} />)
    .with('open', () => <OpenBeat ms={ms} />)
    .with('payoff', () => <PayoffBeat ms={ms} live={live} />)
    .exhaustive();
}
