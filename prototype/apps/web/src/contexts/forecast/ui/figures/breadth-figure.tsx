import type { Figure } from '@reinforce/server/dto';
import { chartAxisLabelClass } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { type BreadthPart, breadthParts } from '../../domain/figure-vm';

const HEIGHT = 44;

const partClass = (key: BreadthPart['key']): string =>
  match(key)
    .with('up', () => 'fill-up')
    .with('flat', () => 'fill-muted-foreground/40')
    .with('down', () => 'fill-down')
    .exhaustive();

const anchorOf = (index: number): 'start' | 'middle' | 'end' => {
  if (index === 0) return 'start';
  return index === 1 ? 'middle' : 'end';
};

export function BreadthFigure({
  figure,
  width,
}: {
  readonly figure: Extract<Figure, { kind: 'breadth' }>;
  readonly width: number;
}) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const parts = breadthParts(figure, width);
  const labelX = [0, width / 2, width];
  return (
    <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden className="block">
      {parts.map((part) => (
        <rect
          key={part.key}
          x={part.x}
          y={4}
          width={part.width}
          height={12}
          rx={3}
          className={partClass(part.key)}
        />
      ))}
      {parts.map((part, i) => (
        <text
          key={part.key}
          x={labelX[i]}
          y={36}
          textAnchor={anchorOf(i)}
          className={cn(chartAxisLabelClass, i === 0 && 'fill-foreground font-semibold')}
        >
          {`${t(`figure.${part.key}`)} ${part.count === null ? fmt.percent(part.share * 100, 0) : fmt.int(part.count)}`}
        </text>
      ))}
    </svg>
  );
}
