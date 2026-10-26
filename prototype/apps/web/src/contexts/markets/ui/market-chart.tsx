import { type Candle, FRAME_MS, type MarketName } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { Toggle } from '@reinforce/ui-react/toggle';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowUp, SquareDashedMousePointer, X } from 'lucide-react';
import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { isLive } from '~/contexts/forecast/domain/episode-vm';
import { forecastEnd } from '~/contexts/forecast/domain/signal-chart-vm';
import { useSignalPalette } from '~/contexts/forecast/ui/signal-palette';
import { SignalPin } from '~/contexts/forecast/ui/signal-pin';
import { type ChartForecast, useForecastDrawing } from '~/contexts/forecast/ui/use-forecast-drawing';
import { useCandleHistory } from '~/contexts/markets/api/use-candle-history';
import { type ComparedCandles, useComparedCandles } from '~/contexts/markets/api/use-compared-candles';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { grabClass, useGrabbing } from '~/shared/hooks/use-grabbing';
import { useIntlLocale, useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import {
  type ChartView,
  dragSpan,
  FRAMES,
  type Frame,
  forecastView,
  type SignalMark,
  type Span,
  type SpanFacts,
  spanEdges,
  spanFacts,
  spanGist,
} from '../domain/chart-vm';
import { type Indicator, indicatorLines, vwapBars } from '../domain/indicators';
import { useChartPalette } from './chart-palette';
import { IndicatorsMenu } from './indicators-menu';
import { LookToggle } from './look-toggle';
import { useSpanWords } from './span-tag';
import { useCandleChart } from './use-candle-chart';
import { type ChartLook, useChartLook, usePickedSpan, usePickSpan } from './use-chart-dock';
import { useIndicators } from './use-indicators';

const POP_WIDTH = 300;
const ASK_POP_WIDTH = 380;
const ASK_LENGTH = 500;
const OPENING_BARS = 36;

export function MarketChart({
  market,
  topic,
  asked,
  marks,
  onAsk,
  forecast,
  compare,
  indicators = false,
  onClose,
  className,
}: {
  readonly market: MarketName;
  readonly topic: string;
  readonly asked: readonly Span[];
  /** Detector signals to mark on the candles; none when absent. */
  readonly marks?: readonly SignalMark[];
  /** Asks the broker about the stretch picked, in the person's words; no field to ask in when absent. */
  readonly onAsk?: (span: Span, text: string) => void;
  /** The forecast to draw over the candles, as its card draws it; none when absent. */
  readonly forecast?: ChartForecast | null;
  /** Markets to draw beside this one, each as its change since the first candle in sight; none when absent. */
  readonly compare?: readonly { readonly coin: string; readonly name: string }[];
  /** Offers the indicators menu and draws what it ticks; none when absent. */
  readonly indicators?: boolean;
  readonly onClose?: () => void;
  readonly className?: string;
}) {
  const { t } = useT('markets');
  const [frame, setFrame] = useState<Frame>('5m');
  const [selecting, setSelecting] = useState(false);
  const [look] = useChartLook();
  const history = useCandleHistory(market.coin, frame);
  const peers = compare ?? [];
  const [ticked] = useIndicators();
  const vwapCandles = vwapBars(FRAME_MS[frame]);
  const unavailable: readonly Indicator[] = vwapCandles === null ? ['vwap'] : [];
  const shownIndicators = indicators ? ticked.filter((indicator) => !unavailable.includes(indicator)) : [];
  const compared = useComparedCandles(
    peers.map((peer) => peer.coin),
    frame,
  );
  return (
    <section
      aria-label={t('chart.label', { name: market.name })}
      className={cn('flex min-h-0 flex-col gap-1', className)}
    >
      <div className="-mx-1 flex min-w-0 items-center gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] max-sm:gap-1.5">
        <ToggleGroup
          type="single"
          aria-label={t('chart.frames')}
          className="shrink-0"
          value={frame}
          onValueChange={(value) => {
            const next = FRAMES.find((f) => f === value);
            if (next) setFrame(next);
          }}
        >
          {FRAMES.map((f) => (
            <ToggleGroupItem key={f} value={f} size="sm">
              {t(`chart.frame.${f}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <LookToggle className="shrink-0" />
        {indicators && (
          <IndicatorsMenu unavailable={unavailable} comparing={peers.length > 0} className="shrink-0" />
        )}
        <Toggle
          size="sm"
          pressed={selecting}
          onPressedChange={setSelecting}
          title={t('chart.selectHint')}
          className="ms-auto shrink-0 rounded-full border-foreground/10 bg-foreground/8 px-3 text-foreground hover:bg-foreground/12 data-[state=on]:border-transparent data-[state=on]:bg-foreground data-[state=on]:text-background"
        >
          <SquareDashedMousePointer aria-hidden />
          <span className="max-sm:sr-only">{t('chart.select')}</span>
        </Toggle>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('chart.close')}
            title={t('chart.close')}
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        )}
      </div>
      {match(history.read)
        .with({ kind: 'failed' }, () => <InlineNote tone="neutral">{t('chart.failed')}</InlineNote>)
        .with({ kind: 'loading' }, () => <Skeleton className="min-h-0 flex-1 rounded-2xl" />)
        .with({ kind: 'ready' }, ({ candles }) =>
          candles.length === 0 ? (
            <InlineNote tone="neutral">{t('chart.empty')}</InlineNote>
          ) : (
            <ChartPane
              topic={topic}
              candles={candles}
              frame={frame}
              asked={asked}
              marks={marks}
              look={look}
              selecting={selecting}
              onSelected={() => setSelecting(false)}
              onAsk={onAsk}
              forecast={forecast ?? null}
              onReachStart={history.reachBack}
              name={market.name}
              indicators={shownIndicators}
              vwapCandles={vwapCandles}
              compared={compared.map((peer, i) => ({ ...peer, name: peers[i]?.name ?? peer.coin }))}
            />
          ),
        )
        .exhaustive()}
    </section>
  );
}

function ChartPane({
  topic,
  candles,
  frame,
  asked,
  marks,
  look,
  selecting,
  onSelected,
  onAsk,
  forecast,
  onReachStart,
  name,
  indicators,
  vwapCandles,
  compared,
}: {
  readonly topic: string;
  readonly candles: readonly Candle[];
  readonly frame: Frame;
  readonly asked: readonly Span[];
  readonly marks: readonly SignalMark[] | undefined;
  readonly look: ChartLook;
  readonly selecting: boolean;
  readonly onSelected: () => void;
  readonly onAsk: ((span: Span, text: string) => void) | undefined;
  readonly forecast: ChartForecast | null;
  readonly onReachStart: () => void;
  readonly name: string;
  readonly indicators: readonly Indicator[];
  readonly vwapCandles: number | null;
  readonly compared: readonly (ComparedCandles & { readonly name: string })[];
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [pin, setPin] = useState<HTMLDivElement | null>(null);
  useGrabbing(host);
  const [drag, setDrag] = useState<{ readonly start: number; readonly end: number } | null>(null);
  const shift = useShiftHeld();
  const palette = useChartPalette();
  const locale = useIntlLocale();
  const picked = usePickedSpan(topic);
  const pick = usePickSpan();
  const signalPalette = useSignalPalette();
  const drawing = useForecastDrawing(forecast, candles);
  const end = forecast ? forecastEnd(forecast.forecast) : null;
  const view = useCandleChart({
    host,
    candles,
    frame,
    palette,
    locale,
    focus: picked,
    marks,
    look,
    onReachStart,
    forecast:
      forecast && drawing && end !== null
        ? {
            drawing,
            end,
            opening: isLive(forecast.forecast)
              ? forecastView(forecast.forecast.t0, end, frame, OPENING_BARS)
              : null,
            palette: signalPalette,
          }
        : null,
    pin,
    name,
    indicators: indicatorLines(candles, indicators, vwapCandles),
    compare: compared.flatMap(({ coin, name: peerName, candles: peer }, i) =>
      peer ? [{ coin, name: peerName, color: palette.peers[i] ?? palette.cross, candles: peer }] : [],
    ),
  });
  const facts = picked ? spanFacts(candles, picked, frame) : null;

  useEffect(() => {
    const clear = (event: KeyboardEvent) => {
      if (event.key === 'Escape') pick(topic, null);
    };
    window.addEventListener('keydown', clear);
    return () => window.removeEventListener('keydown', clear);
  }, [pick, topic]);

  const catching = (selecting || shift) && view !== null;
  const xOf = (event: PointerEvent<HTMLDivElement>) =>
    event.clientX - event.currentTarget.getBoundingClientRect().left;
  const draft = drag && view ? dragSpan(candles, view, drag.start, drag.end, frame) : null;
  const shown = draft ?? picked;

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={setHost} className={cn('absolute inset-0', grabClass)} />
      {forecast?.signal && (
        <div ref={setPin} className="pointer-events-none invisible absolute top-0 left-0 z-10">
          <SignalPin signal={forecast.signal} />
        </div>
      )}
      {view && (
        <div
          aria-hidden
          className="pointer-events-none absolute start-0 top-0"
          style={{ width: view.width, height: view.height }}
        >
          {asked.map((span, index) => (
            <Band
              key={`${span.from}-${span.to}`}
              span={span}
              candles={candles}
              view={view}
              tag={String(index + 1)}
            />
          ))}
          {shown && <Band span={shown} candles={candles} view={view} strong />}
        </div>
      )}
      {catching && view && (
        <div
          className="absolute start-0 top-0 z-10 cursor-col-resize touch-none"
          style={{ width: view.width, height: view.height }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDrag({ start: xOf(event), end: xOf(event) });
          }}
          onPointerMove={(event) => {
            if (drag) setDrag({ ...drag, end: xOf(event) });
          }}
          onPointerUp={() => {
            if (draft && Math.abs((drag?.end ?? 0) - (drag?.start ?? 0)) > 4) {
              pick(topic, draft, spanGist(candles, draft, frame));
              onSelected();
            }
            setDrag(null);
          }}
        />
      )}
      {view && picked && facts && !drag && (
        <SpanPop
          facts={facts}
          view={view}
          candles={candles}
          onAsk={onAsk ? (text) => onAsk(picked, text) : undefined}
          onClose={() => pick(topic, null)}
        />
      )}
    </div>
  );
}

function Band({
  span,
  candles,
  view,
  tag,
  strong = false,
}: {
  readonly span: Span;
  readonly candles: readonly Candle[];
  readonly view: ChartView;
  readonly tag?: string;
  readonly strong?: boolean;
}) {
  const edges = spanEdges(candles, span, view);
  if (!edges) return null;
  return (
    <div
      className={cn(
        'absolute top-0 h-full',
        strong
          ? 'bg-primary/10 shadow-[inset_1px_0_0_color-mix(in_oklab,var(--primary)_60%,transparent),inset_-1px_0_0_color-mix(in_oklab,var(--primary)_60%,transparent)]'
          : 'bg-foreground/4',
      )}
      style={{ left: edges[0], width: edges[1] - edges[0] }}
    >
      {tag && (
        <span className="absolute top-1.5 left-1/2 grid size-4.5 -translate-x-1/2 place-items-center rounded-full bg-foreground/70 font-semibold text-[0.6875rem] text-background">
          {tag}
        </span>
      )}
    </div>
  );
}

function SpanPop({
  facts,
  view,
  candles,
  onAsk,
  onClose,
}: {
  readonly facts: SpanFacts;
  readonly view: ChartView;
  readonly candles: readonly Candle[];
  readonly onAsk: ((text: string) => void) | undefined;
  readonly onClose: () => void;
}) {
  const { t } = useT('markets');
  const f = useFormatters();
  const spanWords = useSpanWords();
  const edges = spanEdges(candles, facts.span, view);
  if (!edges) return null;
  const width = Math.min(onAsk ? ASK_POP_WIDTH : POP_WIDTH, view.width - 16);
  const center = Math.max(8 + width / 2, Math.min(view.width - 8 - width / 2, (edges[0] + edges[1]) / 2));
  const figures = (
    <>
      <span className="truncate text-muted-foreground">{spanWords(facts.span)}</span>
      <Numeral tone="direction" direction={directionOf(facts.change, 2)}>
        {f.change(facts.change, 2)}
      </Numeral>
      {facts.volumeRatio !== null && (
        <span className="shrink-0 text-muted-foreground max-sm:hidden">
          {t('chart.volume', { ratio: f.decimal(facts.volumeRatio, 1) })}
        </span>
      )}
    </>
  );
  const clear = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('chart.clear')}
      className="ms-auto shrink-0"
      onClick={onClose}
    >
      <X aria-hidden />
    </Button>
  );
  const popClass =
    'glass-island glass-lift motion-safe:fade-in motion-safe:zoom-in-95 absolute top-2 z-20 -translate-x-1/2 text-meta motion-safe:animate-in motion-safe:duration-200';
  if (!onAsk)
    return (
      <div
        className={cn(popClass, 'flex w-max items-center gap-2.5 rounded-full py-1 ps-3.5 pe-1')}
        style={{ left: center, maxWidth: view.width - 16 }}
      >
        {figures}
        {clear}
      </div>
    );
  return (
    <div
      className={cn(popClass, 'flex flex-col gap-1 rounded-[1.25rem] p-1.5')}
      style={{ left: center, width }}
    >
      <div className="flex min-w-0 items-center gap-2.5 ps-2.5">
        {figures}
        {clear}
      </div>
      <AskField onAsk={onAsk} />
    </div>
  );
}

/** Where the person asks about the stretch in their own words; with none, it asks what went on there. */
function AskField({ onAsk }: { readonly onAsk: (text: string) => void }) {
  const { t } = useT('markets');
  const [text, setText] = useState('');
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) field.current?.focus({ preventScroll: true });
  }, []);
  return (
    <form
      className="surface-inset flex items-center gap-1.5 rounded-full py-1 ps-3.5 pe-1"
      onSubmit={(event) => {
        event.preventDefault();
        onAsk(text.trim() || t('chart.happening'));
      }}
    >
      <input
        ref={field}
        value={text}
        maxLength={ASK_LENGTH}
        enterKeyHint="send"
        aria-label={t('chart.placeholder')}
        placeholder={t('chart.happening')}
        className="min-w-0 flex-1 bg-transparent text-foreground text-row outline-none placeholder:text-muted-foreground"
        onChange={(event) => setText(event.target.value)}
      />
      <Button type="submit" size="icon-sm" aria-label={t('chart.send')}>
        <ArrowUp aria-hidden />
      </Button>
    </form>
  );
}

const typing = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));

function useShiftHeld(): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && !typing(event.target)) setHeld(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setHeld(false);
    };
    const lost = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', lost);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', lost);
    };
  }, []);
  return held;
}
