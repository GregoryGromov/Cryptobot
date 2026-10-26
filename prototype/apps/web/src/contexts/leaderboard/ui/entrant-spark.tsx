import { sparkPath } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';

const FRAME = { width: 96, height: 28, pad: 3 } as const;

const TONE = {
  mine: 'text-[var(--chart-1)]',
  lit: 'text-foreground',
  rest: 'text-foreground/35',
} as const;

export function EntrantSpark({
  curve,
  tone,
  className,
}: {
  readonly curve: readonly number[];
  readonly tone: keyof typeof TONE;
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden
      width={FRAME.width}
      height={FRAME.height}
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      className={cn(
        'shrink-0 transition-colors duration-200 motion-reduce:transition-none',
        TONE[tone],
        className,
      )}
    >
      <path
        d={sparkPath(curve, FRAME)}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={tone === 'mine' ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="[stroke-dasharray:1] motion-safe:animate-[draw-line_900ms_var(--ease-emphasized)_both]"
      />
    </svg>
  );
}
