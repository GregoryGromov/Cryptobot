import type { Candle, ForecastNote, MarketName } from '@reinforce/server/dto';
import { chartFrameClass } from '@reinforce/ui-primitives/charts';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { directionOf } from '~/shared/format/percent';
import { type Formatters, useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { ChartTooltip, ChartTooltipGroup, ChartTooltipRow } from '~/shared/ui/chart/chart-tooltip';
import { useChartCrosshair } from '~/shared/ui/chart/use-chart-crosshair';
import { useChartWidth } from '~/shared/ui/chart/use-chart-width';
import { Numeral } from '~/shared/ui/numeral';
import { readingBehind } from '../domain/fan-reading-vm';
import { FAN, type FanGeometry, type FanPoint, fanGeometry, historyOf } from '../domain/fan-vm';
import { horizonWords } from '../domain/verdict';
import { FanMarks } from './fan-marks';

type ChartRead = {
  readonly data: { readonly candles: readonly Candle[] } | undefined;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => unknown;
};

const PLOT_CLASS = 'h-55';
const EMPTY_FRAME = { width: 0, padLeft: 0, padRight: 0 } as const;

export function FanChart({
  forecast,
  market,
  chart,
  now,
  pendingSince,
}: {
  readonly forecast: Pick<ForecastNote, 't0' | 'p0' | 'horizons'>;
  readonly market: MarketName;
  readonly chart: ChartRead;
  readonly now: number;
  readonly pendingSince?: number;
}) {
  const { t } = useT('forecast');
  return (
    <AsyncView
      query={chart}
      errorTitle={t('fan.failed')}
      loading={<FanSkeleton />}
      empty={{
        when: (data) => forecast.p0 === null && historyOf(data.candles, forecast.t0).length === 0,
        render: <p className="py-6 text-center text-muted-foreground text-sm">{t('fan.empty')}</p>,
      }}
    >
      {(data) => (
        <FanPlot
          forecast={forecast}
          market={market}
          candles={data.candles}
          now={now}
          pendingSince={pendingSince}
        />
      )}
    </AsyncView>
  );
}

function FanPlot({
  forecast,
  market,
  candles,
  now,
  pendingSince,
}: {
  readonly forecast: Pick<ForecastNote, 't0' | 'p0' | 'horizons'>;
  readonly market: MarketName;
  readonly candles: readonly Candle[];
  readonly now: number;
  readonly pendingSince: number | undefined;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const [behind] = useState(() => readingBehind(pendingSince, now));
  const fan = fanGeometry({ forecast, candles, now, width });
  const crosshair = useChartCrosshair({
    positions: fan?.points.map((p) => p.x) ?? [],
    frame: fan?.frame ?? EMPTY_FRAME,
    active: fan !== null,
  });
  const hovered = crosshair.index === null ? null : (fan?.points[crosshair.index] ?? null);
  const shown = hovered ?? fan?.last ?? null;
  const pointText = (p: FanPoint) => t('fan.point', { time: fmt.clock(p.at), price: fmt.price(p.price) });

  return (
    <div className="flex flex-col gap-1.5">
      <FanReadout fan={fan} />
      <div ref={ref} className={cn(chartFrameClass, PLOT_CLASS)}>
        {fan && (
          <>
            <FanMarks
              fan={fan}
              hovered={hovered}
              label={fanSummary(fan, market, t, format, fmt)}
              behind={pendingSince === undefined ? null : behind}
            />
            {pendingSince !== undefined && fan.horizons.length === 0 && <ReadingBeam fan={fan} />}
            <div
              role="slider"
              tabIndex={0}
              aria-label={t('fan.scrub', { name: market.name })}
              aria-valuemin={0}
              aria-valuemax={Math.max(fan.points.length - 1, 0)}
              aria-valuenow={crosshair.index ?? Math.max(fan.points.length - 1, 0)}
              aria-valuetext={shown ? pointText(shown) : undefined}
              className="focus-ring absolute inset-0 touch-pan-y rounded-md"
              {...crosshair.handlers}
              {...crosshair.keyboardHandlers}
            />
            {hovered && <FanTooltip fan={fan} point={hovered} />}
          </>
        )}
      </div>
    </div>
  );
}

function ReadingBeam({ fan }: { readonly fan: FanGeometry }) {
  return (
    <div
      aria-hidden
      data-reading
      style={{
        left: FAN.padLeft,
        top: fan.plotTop,
        width: fan.t0X - FAN.padLeft,
        height: fan.plotBottom - fan.plotTop,
      }}
      className="pointer-events-none absolute overflow-hidden motion-reduce:hidden"
    >
      <span className="absolute inset-y-0 w-16 border-primary/45 border-e bg-linear-to-r from-transparent to-primary/15 motion-safe:animate-[reading-scan_2.4s_linear_infinite]" />
    </div>
  );
}

function fanSummary(
  fan: FanGeometry,
  market: MarketName,
  t: TFunction<'forecast'>,
  format: TFunction<'format'>,
  fmt: Formatters,
): string {
  const horizons = fan.horizons
    .map((h) =>
      t('fan.horizon', {
        term: horizonWords(format, h.horizon),
        price: fmt.price(h.price),
        lo: fmt.price(h.lo),
        hi: fmt.price(h.hi),
      }),
    )
    .join('; ');
  return t('fan.summary', {
    name: market.name,
    from: fmt.clock(fan.start),
    to: fmt.clock(fan.last.at),
    lo: fmt.price(fan.observed?.lo ?? fan.p0),
    hi: fmt.price(fan.observed?.hi ?? fan.p0),
    horizons,
  });
}

function FanReadout({ fan }: { readonly fan: FanGeometry | null }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  if (fan === null) return <ReadoutSkeleton />;
  const { last } = fan;
  return (
    <div className="flex min-h-5 items-baseline justify-between gap-3 text-meta">
      <span className="flex items-baseline gap-2">
        <Numeral tone="foreground" weight="semibold">
          {fmt.price(last.price)}
        </Numeral>
        {last.at > fan.t0 && last.since !== null && (
          <Numeral tone="direction" direction={directionOf(last.since, 2)}>
            {t('fan.change', { change: fmt.change(last.since, 2) })}
          </Numeral>
        )}
      </span>
      <span className="text-muted-foreground">
        {fan.live ? t('fan.now', { time: fmt.clock(last.at) }) : t('fan.final', { time: fmt.clock(last.at) })}
      </span>
    </div>
  );
}

function FanTooltip({ fan, point }: { readonly fan: FanGeometry; readonly point: FanPoint }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  return (
    <ChartTooltip
      frame={{ width: fan.width, height: fan.height }}
      position={point.x}
      avoidY={point.y}
      title={fmt.clock(point.at)}
    >
      <ChartTooltipGroup>
        <ChartTooltipRow label={t('fan.price')} value={fmt.price(point.price)} />
        {point.since !== null && point.at > fan.t0 && (
          <ChartTooltipRow label={t('fan.since')} value={fmt.change(point.since, 2)} tone="context" />
        )}
      </ChartTooltipGroup>
    </ChartTooltip>
  );
}

function ReadoutSkeleton() {
  const { t } = useT('forecast');
  return (
    <div className="flex min-h-5 items-baseline justify-between gap-3 text-meta">
      <SkeletonLines>{t('fan.price')}</SkeletonLines>
      <SkeletonLines>{t('fan.since')}</SkeletonLines>
    </div>
  );
}

function FanSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <ReadoutSkeleton />
      <Skeleton className={cn(PLOT_CLASS, 'w-full')} />
    </div>
  );
}
