import { chartAxisLabelClass, chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { RATIO, ratioGeometry } from '../../domain/figure-vm';

export function RatioFigure({ value, width }: { readonly value: number; readonly width: number }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const bars = ratioGeometry(value, width);
  return (
    <svg
      width={width}
      height={RATIO.height}
      viewBox={`0 0 ${width} ${RATIO.height}`}
      aria-hidden
      className="block"
    >
      <text x={0} y={RATIO.usualY + 10} className={chartAxisLabelClass}>
        {t('figure.usual')}
      </text>
      <rect
        x={RATIO.label}
        y={RATIO.usualY}
        width={bars.usual}
        height={RATIO.bar}
        rx={3}
        className="fill-foreground/20"
      />
      <text x={bars.usualEnd + 6} y={RATIO.usualY + 10} className={chartAxisLabelClass}>
        {`×${fmt.decimal(1, 0)}`}
      </text>
      <text x={0} y={RATIO.nowY + 10} className={cn(chartAxisLabelClass, 'fill-foreground font-semibold')}>
        {t('figure.atForecast')}
      </text>
      <rect
        x={RATIO.label}
        y={RATIO.nowY}
        width={bars.now}
        height={RATIO.bar}
        rx={3}
        fill={chartSeriesVars[0]}
      />
      <text
        x={bars.nowEnd + 6}
        y={RATIO.nowY + 10}
        className={cn(chartAxisLabelClass, 'fill-foreground font-semibold')}
      >
        {`×${fmt.decimal(value, 1)}`}
      </text>
    </svg>
  );
}
