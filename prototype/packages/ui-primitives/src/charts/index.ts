import { cva } from 'class-variance-authority';
import { bisectCenter, extent, nice, ticks } from 'd3-array';
import { arc, area, line, type PieArcDatum, pie } from 'd3-shape';

export type { ChartBoxSize, PlotFrame, PointerPoint } from './geometry.js';
export {
  clampPlotX,
  isTap,
} from './geometry.js';
export { placeTooltip } from './tooltip-placement.js';

export const DONUT = { size: 240, center: 120, outer: 110, inner: 72 } as const;

const donutPie = pie<number>()
  .sort(null)
  .value((share) => share);

// invariant: 2.4 of the 240 viewBox = the bars' 2px gap-0.5 at the 200px render.
const DONUT_GAP = 2.4;

// constraint: padRadius = outer makes d3 cut a parallel gap of DONUT_GAP, not a wedge.
const donutArc = arc<PieArcDatum<number>>()
  .innerRadius(DONUT.inner)
  .outerRadius(DONUT.outer)
  .padRadius(DONUT.outer)
  .padAngle(DONUT_GAP / DONUT.outer);

export function donutPaths(shares: readonly number[]): readonly string[] {
  return donutPie([...shares]).map((slice) => donutArc(slice) ?? '');
}

export type DonutIds = {
  readonly segment: (index: number) => string;
  readonly rim: string;
  readonly shadow: string;
};

export function donutIds(idPrefix: string): DonutIds {
  return {
    segment: (index) => `${idPrefix}-seg-${index}`,
    rim: `${idPrefix}-rim`,
    shadow: `${idPrefix}-shadow`,
  };
}

export type LinearScale = (value: number) => number;

export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  return (value) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0));
}

export type SeriesValue = number | null;

const definedValue = (value: SeriesValue): value is number => value !== null;

export function linePath(values: readonly SeriesValue[], x: LinearScale, y: LinearScale): string {
  const generate = line<SeriesValue>()
    .defined(definedValue)
    .x((_, index) => x(index))
    .y((value) => y(value ?? 0));
  return generate(values) ?? '';
}

export function areaPath(
  values: readonly SeriesValue[],
  x: LinearScale,
  y: LinearScale,
  baselineY: number,
): string {
  const generate = area<SeriesValue>()
    .defined(definedValue)
    .x((_, index) => x(index))
    .y0(baselineY)
    .y1((value) => y(value ?? 0));
  return generate(values) ?? '';
}

export type SparkFrame = { readonly width: number; readonly height: number; readonly pad: number };

const sparkScales = (values: readonly SeriesValue[], frame: SparkFrame) => {
  const [min, max] = valueExtent(values) ?? [0, 1];
  return {
    x: linearScale([0, Math.max(values.length - 1, 1)], [frame.pad, frame.width - frame.pad]),
    y: linearScale([min, max], [frame.height - frame.pad, frame.pad]),
  };
};

export function sparkPath(values: readonly SeriesValue[], frame: SparkFrame): string {
  const { x, y } = sparkScales(values, frame);
  return linePath(values, x, y);
}

export function sparkAreaPath(values: readonly SeriesValue[], frame: SparkFrame): string {
  const { x, y } = sparkScales(values, frame);
  return areaPath(values, x, y, frame.height);
}

export function valueExtent(values: readonly SeriesValue[]): readonly [number, number] | null {
  const [min, max] = extent(values.filter(definedValue));
  return min === undefined || max === undefined ? null : [min, max];
}

export type ChartTicks = {
  readonly domain: readonly [number, number];
  readonly ticks: readonly number[];
};

export function chartTicks(min: number, max: number, count: number): ChartTicks {
  const [lo, hi] = nice(min, max, count);
  return { domain: [lo, hi], ticks: ticks(lo, hi, count) };
}

export type FittedTicks = {
  readonly lo: number;
  readonly hi: number;
  readonly count: number;
  readonly minSpan: number;
};

const FIT_PAD_FRACTION = 0.1;

export function fittedTicks({ lo, hi, count, minSpan }: FittedTicks): ChartTicks {
  const span = hi - lo;
  const pad = Math.max(span * FIT_PAD_FRACTION, (minSpan - span) / 2, 0);
  return chartTicks(lo - pad, hi + pad, count);
}

export function withinDomain(domain: readonly [number, number], value: number): boolean {
  return value >= domain[0] && value <= domain[1];
}

export function nearestIndex(positions: readonly number[], position: number): number {
  return bisectCenter(positions, position);
}

export const chartSeriesVars = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export function seriesColor(index: number): string {
  return chartSeriesVars[index % chartSeriesVars.length] ?? chartSeriesVars[0];
}

export const chartFrameClass = 'relative w-full select-none overflow-hidden';

export const chartTooltipClass =
  'glass-strong corner-squircle pointer-events-none z-50 w-fit rounded-xl px-3 py-2 text-xs text-foreground';

export const chartTooltipTitleClass = 'font-medium';

export const chartTooltipGroupClass =
  'mt-1.5 space-y-0.5 border-border/60 border-t pt-1.5 first:mt-1 first:border-none first:pt-0';

export const chartTooltipRowVariants = cva('flex items-center justify-between gap-3', {
  variants: {
    tone: { series: '', context: 'text-muted-foreground' },
  },
  defaultVariants: { tone: 'series' },
});

export const chartTooltipLabelClass = 'flex items-center gap-1.5';

export const chartTooltipSwatchClass = 'size-2 rounded-full';

export const chartAxisLabelClass = 'fill-muted-foreground text-[0.6875rem] font-figure';
