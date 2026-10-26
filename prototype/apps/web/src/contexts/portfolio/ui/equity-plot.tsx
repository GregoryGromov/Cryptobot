import {
  chartAxisLabelClass,
  chartFrameClass,
  fittedTicks,
  linearScale,
  linePath,
  withinDomain,
} from '@reinforce/ui-primitives/charts';
import { TabsContent } from '@reinforce/ui-react/tabs';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { ChartTooltip, ChartTooltipRow } from '~/shared/ui/chart/chart-tooltip';
import { useChartCrosshair } from '~/shared/ui/chart/use-chart-crosshair';
import { useChartBoxSize } from '~/shared/ui/chart/use-chart-width';
import type { BookView } from '../domain/book-vm';
import { fromCents, type Period, stepPoints, withinPeriod } from '../domain/equity';

const AXIS = 20;
const TOP = 8;
const PAD = 4;
const SCALE = 60;
const LINE = 'var(--foreground)';

export function EquityPlot({ value, view }: { readonly value: Period; readonly view: BookView }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  const { ref, size } = useChartBoxSize<HTMLDivElement>();
  const { width, height } = size;
  const points = withinPeriod(view.equity, value, view.until);
  const right = width - SCALE;
  const frame = { width, padLeft: PAD, padRight: SCALE };
  const first = points[0];
  const last = points.at(-1);
  const x = linearScale([first?.at ?? 0, last?.at ?? 1], [PAD, right]);
  const positions = points.map((point) => x(point.at));
  const crosshair = useChartCrosshair({ positions, frame, active: points.length > 1 && width > 0 });
  if (first === undefined || last === undefined || points.length < 2)
    return (
      <TabsContent value={value} className="flex min-h-44 items-center justify-center">
        <p className="text-center text-meta text-muted-foreground">
          {view.equity.length === 0 ? t('chart.empty') : t('chart.emptyPeriod')}
        </p>
      </TabsContent>
    );
  const navs = points.map((point) => fromCents(point.cents));
  const start = view.cycle?.startNav ?? navs[0] ?? 0;
  const ticks = fittedTicks({
    lo: Math.min(...navs),
    hi: Math.max(...navs),
    count: 3,
    minSpan: start * 0.01,
  });
  const y = linearScale(ticks.domain, [height - AXIS, TOP]);
  const steps = stepPoints(points);
  const stepXs = steps.map((point) => x(point.at));
  const stepNavs = steps.map((point) => fromCents(point.cents));
  const atStep = (index: number) => stepXs[index] ?? 0;
  const tickText = ticks.ticks.every(Number.isInteger) ? fmt.usdWhole : fmt.usd;
  const picked = crosshair.index === null ? null : (points[crosshair.index] ?? null);
  const summary = t('chart.summary', {
    from: fmt.dateTime(first.at),
    to: fmt.dateTime(last.at),
    start: fmt.usd(fromCents(first.cents)),
    end: fmt.usd(fromCents(last.cents)),
  });
  return (
    <TabsContent
      value={value}
      {...crosshair.keyboardHandlers}
      className="focus-ring flex flex-col rounded-md"
    >
      <div ref={ref} className={cn(chartFrameClass, 'min-h-44 flex-1 touch-pan-y')} {...crosshair.handlers}>
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={summary}
            className="absolute inset-0"
          >
            {ticks.ticks.map((tick) => (
              <g key={tick}>
                <line x1={PAD} x2={right} y1={y(tick)} y2={y(tick)} className="stroke-foreground/7" />
                <text x={width - PAD} y={y(tick) + 4} textAnchor="end" className={chartAxisLabelClass}>
                  {tickText(tick)}
                </text>
              </g>
            ))}
            {withinDomain(ticks.domain, start) && (
              <line
                x1={PAD}
                x2={right}
                y1={y(start)}
                y2={y(start)}
                strokeDasharray="3 4"
                className="stroke-border"
              />
            )}
            <path d={linePath(stepNavs, atStep, y)} fill="none" stroke={LINE} strokeWidth={1.5} />
            {picked !== null && (
              <>
                <line
                  x1={x(picked.at)}
                  x2={x(picked.at)}
                  y1={TOP}
                  y2={height - AXIS}
                  className="stroke-foreground/30"
                />
                <circle
                  cx={x(picked.at)}
                  cy={y(fromCents(picked.cents))}
                  r={4}
                  fill={LINE}
                  className="stroke-2 stroke-background"
                />
              </>
            )}
            <text x={PAD} y={height - 5} className={chartAxisLabelClass}>
              {fmt.day(first.at)}
            </text>
            <text x={right} y={height - 5} textAnchor="end" className={chartAxisLabelClass}>
              {fmt.dateTime(last.at)}
            </text>
          </svg>
        )}
        {picked !== null && (
          <ChartTooltip
            frame={{ width, height }}
            position={x(picked.at)}
            avoidY={y(fromCents(picked.cents))}
            title={fmt.dateTime(picked.at)}
          >
            <ChartTooltipRow label={t('value.label')} value={fmt.usd(fromCents(picked.cents))} color={LINE} />
          </ChartTooltip>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {picked === null
          ? null
          : t('chart.point', { time: fmt.dateTime(picked.at), nav: fmt.usd(fromCents(picked.cents)) })}
      </p>
    </TabsContent>
  );
}
