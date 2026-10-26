import {
  type ChartBoxSize,
  chartTooltipClass,
  chartTooltipGroupClass,
  chartTooltipLabelClass,
  chartTooltipRowVariants,
  chartTooltipSwatchClass,
  chartTooltipTitleClass,
  placeTooltip,
} from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { Numeral } from '~/shared/ui/numeral';
import { useChartBoxSize } from './use-chart-width';

export type ChartTooltipRowTone = 'series' | 'context';

export function ChartTooltip({
  frame,
  position,
  avoidY = null,
  title,
  children,
}: {
  readonly frame: ChartBoxSize;
  readonly position: number;
  readonly avoidY?: number | null;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const { ref, size } = useChartBoxSize<HTMLDivElement>();
  const { left, top } = placeTooltip({ frame, size, position, avoidY });

  return (
    <div
      ref={ref}
      style={{ left: 0, top: 0, transform: `translate3d(${left}px, ${top}px, 0)` }}
      className={cn(
        chartTooltipClass,
        'absolute transition-opacity duration-200',
        size.width === 0 ? 'opacity-0' : 'opacity-100',
      )}
    >
      <p className={chartTooltipTitleClass}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

export function ChartTooltipGroup({ children }: { readonly children: ReactNode }) {
  return <div className={chartTooltipGroupClass}>{children}</div>;
}

export function ChartTooltipRow({
  label,
  value,
  color,
  tone = 'series',
}: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
  readonly tone?: ChartTooltipRowTone;
}) {
  return (
    <p className={chartTooltipRowVariants({ tone })}>
      <span className={chartTooltipLabelClass}>
        {color !== undefined && (
          <span aria-hidden="true" className={chartTooltipSwatchClass} style={{ background: color }} />
        )}
        {label}
      </span>
      <Numeral>{value}</Numeral>
    </p>
  );
}
