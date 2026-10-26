import { sparkPath } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import type { Direction } from '~/shared/format/percent';
import { directionClass } from '~/shared/ui/direction-class';

const FRAME = { width: 88, height: 28, pad: 2 } as const;

export function HourSpark({
  values,
  direction,
  className,
}: {
  readonly values: readonly number[];
  readonly direction: Direction;
  readonly className?: string;
}) {
  if (values.length < 2) return <span aria-hidden className={cn('block h-7 w-22', className)} />;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      preserveAspectRatio="none"
      className={cn('h-7 w-22', directionClass(direction), className)}
    >
      <path
        d={sparkPath(values, FRAME)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
