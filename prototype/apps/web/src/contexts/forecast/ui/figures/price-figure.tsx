import type { Figure } from '@reinforce/server/dto';
import { chartAxisLabelClass, chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { PRICE, priceFigureGeometry } from '../../domain/figure-vm';

const LINE_COLOR = chartSeriesVars[0];

export function PriceFigure({
  figure,
  width,
}: {
  readonly figure: Extract<Figure, { kind: 'price' }>;
  readonly width: number;
}) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const g = priceFigureGeometry(figure, width);
  return (
    <svg width={width} height={g.height} viewBox={`0 0 ${width} ${g.height}`} aria-hidden className="block">
      {g.span && (
        <rect
          x={g.span.x}
          y={PRICE.top}
          width={g.span.width}
          height={g.plotEnd - PRICE.top}
          className="fill-foreground/[0.05]"
        />
      )}
      {g.levels.map((level) => (
        <g key={level.name}>
          <line
            x1={PRICE.inset}
            x2={g.right}
            y1={level.y}
            y2={level.y}
            strokeDasharray="4 3"
            className="stroke-foreground/35"
          />
          <text
            x={g.right - 4}
            y={level.y - 4}
            textAnchor="end"
            paintOrder="stroke"
            strokeWidth={3}
            className={cn(chartAxisLabelClass, 'stroke-card')}
          >
            {level.name}
          </text>
          <text x={g.right + 6} y={level.y + 4} className={cn(chartAxisLabelClass, 'fill-foreground')}>
            {fmt.price(level.price)}
          </text>
        </g>
      ))}
      <path
        d={g.line}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="motion-safe:animate-[draw-line_700ms_ease-out_both]"
      />
      <circle
        cx={g.end.x}
        cy={g.end.y}
        r={3.5}
        fill={LINE_COLOR}
        strokeWidth={1.5}
        className="motion-safe:fade-in fill-mode-both stroke-card motion-safe:animate-in motion-safe:delay-500 motion-safe:duration-300"
      />
      {g.volumes.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x - bar.width / 2}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1}
          className={bar.marked ? 'fill-foreground/55' : 'fill-foreground/20'}
        />
      ))}
      {g.usual !== null && (
        <>
          <line
            x1={PRICE.inset}
            x2={g.right}
            y1={g.usual}
            y2={g.usual}
            strokeDasharray="3 3"
            className="stroke-foreground/40"
          />
          <text x={g.right + 6} y={g.usual + 4} className={chartAxisLabelClass}>
            {t('figure.usualVolume')}
          </text>
        </>
      )}
      {figure.volumeTimes !== null && figure.volumes && (
        <text
          x={g.right + 6}
          y={g.volumeTop + 8}
          className={cn(chartAxisLabelClass, 'fill-foreground font-semibold')}
        >
          {`×${fmt.decimal(figure.volumeTimes, 1)}`}
        </text>
      )}
      <text x={PRICE.inset} y={g.height - 4} className={chartAxisLabelClass}>
        {fmt.clock(figure.startAt)}
      </text>
      <text x={g.right} y={g.height - 4} textAnchor="end" className={chartAxisLabelClass}>
        {fmt.clock(g.endAt)}
      </text>
    </svg>
  );
}
