import type { Scale } from '@reinforce/server/dto';
import { chartAxisLabelClass, chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { scaleDigits, type Tone, TRACK, trackGeometry } from '../../domain/figure-vm';

const TRAIL_COLOR = chartSeriesVars[0];
const ZONE_OPACITY = 0.35;

const zoneClass = (tone: Tone): string =>
  match(tone)
    .with('up', () => 'fill-up')
    .with('down', () => 'fill-down')
    .with('flat', () => 'fill-muted-foreground')
    .exhaustive();

export function Track({
  scale,
  width,
  labelled = false,
}: {
  readonly scale: Scale;
  readonly width: number;
  readonly labelled?: boolean;
}) {
  const fmt = useFormatters();
  const track = trackGeometry(scale, width, labelled);
  const digits = scaleDigits(scale);
  const half = TRACK.bar / 2;
  return (
    <svg
      width={width}
      height={track.height}
      viewBox={`0 0 ${width} ${track.height}`}
      aria-hidden
      className="block"
    >
      <rect
        x={track.left}
        y={track.center - half}
        width={track.right - track.left}
        height={TRACK.bar}
        rx={half}
        className="fill-foreground/8"
      />
      {track.zones.map((zone) => (
        <rect
          key={zone.x}
          x={zone.x}
          y={track.center - half}
          width={zone.width}
          height={TRACK.bar}
          rx={half}
          opacity={ZONE_OPACITY}
          className={zoneClass(zone.tone)}
        />
      ))}
      {track.range && (
        <rect
          x={track.range.x}
          y={track.center + 6}
          width={track.range.width}
          height={2}
          rx={1}
          className="fill-foreground/25"
        />
      )}
      {track.line && <path d={track.line} fill="none" stroke={TRAIL_COLOR} strokeWidth={2} />}
      {track.trail.map((point) => (
        <g key={point.label}>
          <circle
            cx={point.x}
            cy={track.center}
            r={point.last ? 5 : 3.4}
            fill={point.last ? TRAIL_COLOR : undefined}
            stroke={point.last ? undefined : TRAIL_COLOR}
            strokeWidth={point.last ? undefined : 1.5}
            className={point.last ? 'stroke-card' : 'fill-card'}
          />
          {labelled && (
            <text
              x={point.x}
              y={track.center - 11}
              textAnchor="middle"
              className={cn(chartAxisLabelClass, point.last && 'fill-foreground font-semibold')}
            >
              {fmt.decimal(point.value, digits)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
