import type { SignalView } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { useT } from '~/shared/i18n';
import { sparkGeometry } from '../domain/spark-vm';
import { signalDirectionClass } from './signal-words';

const FRAMES = {
  row: { width: 64, height: 26, pad: 2 },
  line: { width: 96, height: 30, pad: 3 },
  card: { width: 112, height: 36, pad: 3 },
  wide: { width: 168, height: 48, pad: 4 },
} as const;

export function SignalSpark({
  spark,
  direction,
  dim = false,
  size = 'row',
  decorative = false,
  plain = false,
}: {
  readonly spark: NonNullable<SignalView['spark']>;
  readonly direction: SignalView['direction'];
  readonly dim?: boolean;
  readonly size?: keyof typeof FRAMES;
  readonly decorative?: boolean;
  readonly plain?: boolean;
}) {
  const { t } = useT('signals');
  const fade = useId();
  const frame = FRAMES[size];
  // The wide spark fills its box's width: its strokes keep their width as it stretches.
  const wide = size === 'wide';
  const g = sparkGeometry(spark, frame);
  const label = t('chart', { before: spark.before, after: spark.after });
  return (
    <svg
      width={wide ? '100%' : frame.width}
      height={frame.height}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      preserveAspectRatio={wide ? 'none' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn('shrink-0', dim ? 'text-muted-foreground' : signalDirectionClass(direction))}
    >
      <line
        x1={g.eventX}
        x2={g.eventX}
        y1={0}
        y2={frame.height}
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
        className="stroke-foreground/25"
      />
      {wide && (
        <defs>
          <linearGradient id={fade} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity={0.22} />
            <stop offset="1" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {!plain &&
        (wide ? (
          <path d={g.area} fill={`url(#${fade})`} />
        ) : (
          <path d={g.area} className="fill-current opacity-10" />
        ))}
      <path
        d={g.line}
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        strokeWidth={wide ? 1.75 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
