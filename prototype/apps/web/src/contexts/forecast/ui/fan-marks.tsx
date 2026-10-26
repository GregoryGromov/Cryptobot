import { chartAxisLabelClass, chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { readDelay, readingFan } from '../domain/fan-reading-vm';
import { FAN, type FanGeometry, type FanPoint } from '../domain/fan-vm';

const FORECAST_COLOR = chartSeriesVars[0];
const CORRIDOR_OPACITY = 0.16;
const GHOST_OPACITY = 0.1;

const historyEnterClass = 'motion-safe:animate-[reveal-right_1.4s_var(--ease-emphasized)_both]';
const readClass = 'motion-safe:animate-[read-pulse_2.4s_linear_infinite_both]';
const coneClass = 'motion-safe:animate-[cone-form_2.4s_ease-out_infinite_both]';
const rippleClass =
  '[transform-box:fill-box] origin-center fill-primary/40 motion-safe:animate-[origin-ripple_2.4s_ease-out_infinite_both] motion-reduce:hidden';
const corridorEnterClass = 'motion-safe:fade-in motion-safe:animate-in motion-safe:duration-500';
const expectedEnterClass =
  '[stroke-dasharray:1] motion-safe:animate-[draw-line_900ms_var(--ease-emphasized)_both]';
const horizonEnterClass =
  'motion-safe:fade-in fill-mode-both motion-safe:animate-in motion-safe:delay-700 motion-safe:duration-300';

export function FanMarks({
  fan,
  hovered,
  label,
  behind = null,
}: {
  readonly fan: FanGeometry;
  readonly hovered: FanPoint | null;
  readonly label: string;
  readonly behind?: number | null;
}) {
  const fmt = useFormatters();
  const pending = behind !== null;
  const reading = pending && fan.horizons.length === 0;
  const ghost = reading ? readingFan(fan) : null;
  const arrives = { animationDelay: `${readDelay(fan.origin.x, fan)}ms` };
  return (
    <svg
      width="100%"
      height={fan.height}
      viewBox={`0 0 ${fan.width} ${fan.height}`}
      role="img"
      aria-label={label}
      className="block overflow-visible"
    >
      <rect
        x={fan.t0X}
        y={fan.plotTop}
        width={Math.max(fan.plotRight - fan.t0X, 0)}
        height={fan.plotBottom - fan.plotTop}
        className="fill-foreground/[0.025]"
      />
      {fan.ticks.map((tick) => (
        <g key={tick.value}>
          <line x1={FAN.padLeft} x2={fan.plotRight} y1={tick.y} y2={tick.y} className="stroke-foreground/8" />
          <text x={fan.plotRight + 8} y={tick.y + 3.5} className={chartAxisLabelClass}>
            {fmt.decimal(tick.value, fan.digits)}
          </text>
        </g>
      ))}
      {fan.horizons.map((h) => (
        <line
          key={h.horizon}
          x1={h.x}
          x2={h.x}
          y1={fan.plotTop}
          y2={fan.plotBottom}
          strokeDasharray="2 4"
          className="stroke-foreground/12"
        />
      ))}
      {ghost ? (
        <g style={arrives} className={coneClass}>
          <path d={ghost.cone} fill={FORECAST_COLOR} fillOpacity={GHOST_OPACITY} />
          <path
            d={ghost.middle}
            fill="none"
            stroke={FORECAST_COLOR}
            strokeOpacity={0.45}
            strokeWidth={1.5}
            strokeDasharray="3 5"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <>
          <path
            d={fan.corridor}
            fill={FORECAST_COLOR}
            fillOpacity={CORRIDOR_OPACITY}
            className={pending ? corridorEnterClass : undefined}
          />
          <path
            d={fan.expected}
            pathLength={pending ? 1 : undefined}
            fill="none"
            stroke={FORECAST_COLOR}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={pending ? expectedEnterClass : undefined}
          />
        </>
      )}
      <g
        style={pending ? { animationDelay: `${-behind}ms` } : undefined}
        className={pending ? historyEnterClass : undefined}
      >
        {fan.bars.map((bar) => (
          <g
            key={bar.key}
            style={reading ? { animationDelay: `${readDelay(bar.x, fan)}ms` } : undefined}
            className={cn(bar.up ? 'text-up' : 'text-down', reading && readClass)}
          >
            <line x1={bar.x} x2={bar.x} y1={bar.high} y2={bar.low} className="stroke-current" />
            <rect
              x={bar.x - bar.width / 2}
              y={bar.top}
              width={bar.width}
              height={Math.max(bar.bottom - bar.top, 1)}
              rx={0.5}
              className="fill-current"
            />
          </g>
        ))}
      </g>
      <line
        x1={fan.t0X}
        x2={fan.t0X}
        y1={fan.plotTop}
        y2={fan.plotBottom}
        strokeDasharray="3 3"
        className="stroke-foreground/30"
      />
      {fan.after && (
        <path
          d={fan.after}
          fill="none"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-foreground"
        />
      )}
      {fan.horizons.map((h) => (
        <circle
          key={h.horizon}
          cx={h.x}
          cy={h.y}
          r={3.25}
          fill={FORECAST_COLOR}
          className={cn('stroke-card', pending && horizonEnterClass)}
          strokeWidth={1.5}
        />
      ))}
      {reading && (
        <circle cx={fan.origin.x} cy={fan.origin.y} r={18} style={arrives} className={rippleClass} />
      )}
      <circle cx={fan.origin.x} cy={fan.origin.y} r={3} className="fill-foreground" />
      {fan.live && fan.after !== null && (
        <g>
          <circle cx={fan.last.x} cy={fan.last.y} r={7} className="fill-foreground/12" />
          <circle cx={fan.last.x} cy={fan.last.y} r={3} className="fill-foreground" />
        </g>
      )}
      {hovered && (
        <g>
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={fan.plotTop}
            y2={fan.plotBottom}
            className="stroke-foreground/30"
          />
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r={3.5}
            className="fill-foreground stroke-card"
            strokeWidth={2}
          />
        </g>
      )}
      <text x={FAN.padLeft} y={fan.height - 6} className={chartAxisLabelClass}>
        {fmt.clock(fan.start)}
      </text>
      <text
        x={fan.t0X}
        y={fan.height - 6}
        textAnchor="middle"
        className={cn(chartAxisLabelClass, 'fill-foreground')}
      >
        {fmt.clock(fan.t0)}
      </text>
      {fan.horizons.map((h, index) => (
        <text
          key={h.horizon}
          x={h.x}
          y={fan.height - 6}
          textAnchor={index === fan.horizons.length - 1 ? 'end' : 'middle'}
          className={chartAxisLabelClass}
        >
          {fmt.clock(h.at)}
        </text>
      ))}
    </svg>
  );
}
