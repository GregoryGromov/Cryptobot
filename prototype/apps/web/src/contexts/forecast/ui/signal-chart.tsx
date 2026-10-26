import type { Candle, ForecastNote, MarketName, SignalView } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { LookToggle } from '~/contexts/markets/ui/look-toggle';
import { useChartLook } from '~/contexts/markets/ui/use-chart-dock';
import { trpc } from '~/shared/api/trpc';
import { grabClass, useGrabbing } from '~/shared/hooks/use-grabbing';
import { useIntlLocale, useT } from '~/shared/i18n';
import {
  type ChartLevels,
  forecastEnd,
  openingRange,
  SIGNAL_FRAMES,
  type SignalFrame,
} from '../domain/signal-chart-vm';
import { useSignalPalette } from './signal-palette';
import { SignalPin } from './signal-pin';
import { useForecastDrawing } from './use-forecast-drawing';
import { useSignalChart } from './use-signal-chart';

const OPENING_BARS = 36;

type MinuteRead =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'ready'; readonly candles: readonly Candle[] };

export function SignalChart({
  forecast,
  market,
  minutes,
  levels,
  signal,
  onExpand = null,
}: {
  readonly forecast: ForecastNote;
  readonly market: MarketName;
  readonly minutes: MinuteRead;
  readonly levels: ChartLevels | null;
  readonly signal: SignalView | null;
  /** Opens the larger chart beside the conversation; no such button when absent. */
  readonly onExpand?: (() => void) | null;
}) {
  const { t } = useT('forecast');
  const [frame, setFrame] = useState<SignalFrame>('1m');
  const longer = useQuery(
    trpc.views.candles.queryOptions(
      { coin: market.coin, frame: frame === '1m' ? '5m' : frame },
      { enabled: frame !== '1m', meta: { silent: true } },
    ),
  );
  const read: MinuteRead =
    frame === '1m'
      ? minutes
      : longer.isError
        ? { kind: 'failed' }
        : longer.data
          ? { kind: 'ready', candles: longer.data }
          : { kind: 'loading' };
  return (
    <section aria-label={t('signal.chart.label', { name: market.name })} className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
        <ToggleGroup
          type="single"
          aria-label={t('signal.chart.frames')}
          value={frame}
          onValueChange={(value) => {
            const next = SIGNAL_FRAMES.find((f) => f === value);
            if (next) setFrame(next);
          }}
          className="shrink-0"
        >
          {SIGNAL_FRAMES.map((f) => (
            <ToggleGroupItem key={f} value={f} size="sm">
              {t(`signal.chart.frame.${f}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <LookToggle className="shrink-0" />
        {onExpand && (
          <Button
            variant="ghost"
            size="sm"
            title={t('signal.chart.expand')}
            className="ms-auto shrink-0"
            onClick={onExpand}
          >
            <Maximize2 aria-hidden />
            <span className="max-sm:sr-only">{t('signal.chart.expand')}</span>
          </Button>
        )}
      </div>
      {read.kind === 'failed' && <InlineNote tone="neutral">{t('signal.chart.failed')}</InlineNote>}
      {read.kind === 'loading' && <Skeleton className="h-64 w-full rounded-xl sm:h-72" />}
      {read.kind === 'ready' &&
        (read.candles.length === 0 ? (
          <InlineNote tone="neutral">{t('signal.chart.empty')}</InlineNote>
        ) : (
          <ChartPane
            forecast={forecast}
            name={market.name}
            candles={read.candles}
            frame={frame}
            levels={levels}
            signal={signal}
          />
        ))}
    </section>
  );
}

function ChartPane({
  forecast,
  name,
  candles,
  frame,
  levels,
  signal,
}: {
  readonly forecast: ForecastNote;
  readonly name: string;
  readonly candles: readonly Candle[];
  readonly frame: SignalFrame;
  readonly levels: ChartLevels | null;
  readonly signal: SignalView | null;
}) {
  const { t } = useT('forecast');
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [pin, setPin] = useState<HTMLDivElement | null>(null);
  const [look] = useChartLook();
  useGrabbing(host);
  useSignalChart({
    host,
    pin,
    candles,
    frame,
    palette: useSignalPalette(),
    locale: useIntlLocale(),
    drawing: useForecastDrawing({ forecast, levels, signal }, candles),
    end: forecastEnd(forecast),
    opening: openingRange(forecast, frame, OPENING_BARS),
    look,
  });
  return (
    <div className="relative h-64 w-full sm:h-72">
      <div
        ref={setHost}
        role="img"
        aria-label={t('signal.chart.label', { name })}
        className={cn('size-full touch-pan-y', grabClass)}
      />
      {signal && (
        <div ref={setPin} className="pointer-events-none invisible absolute top-0 left-0 z-10">
          <SignalPin signal={signal} />
        </div>
      )}
    </div>
  );
}
