import type { Figure } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';
import { type Formatters, useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { tickerOf } from '~/shared/routing/topics';
import { useChartWidth } from '~/shared/ui/chart/use-chart-width';
import { BreadthFigure } from './breadth-figure';
import { CompareFigure } from './compare-figure';
import { PriceFigure } from './price-figure';
import { RatioFigure } from './ratio-figure';
import { ScaleFigure, scaleTrailWords } from './scale-figure';

const figureLabel = (figure: Figure, t: TFunction<'forecast'>, fmt: Formatters): string =>
  match(figure)
    .with({ kind: 'price' }, (f) =>
      t('figure.price', {
        from: fmt.clock(f.startAt),
        to: fmt.clock(f.startAt + (f.closes.length - 1) * 60_000),
        lo: fmt.price(Math.min(...f.closes)),
        hi: fmt.price(Math.max(...f.closes)),
      }),
    )
    .with({ kind: 'ratio' }, (f) => t('figure.ratio', { value: fmt.decimal(f.value, 1) }))
    .with({ kind: 'scale' }, (f) => scaleTrailWords(f, fmt.decimal))
    .with({ kind: 'breadth' }, (f) =>
      t('figure.breadth', {
        up: fmt.percent(f.up * 100, 0),
        flat: fmt.percent(f.flat * 100, 0),
        down: fmt.percent(f.down * 100, 0),
      }),
    )
    .with({ kind: 'compare' }, (f) =>
      f.rows.map((r) => `${tickerOf(r.label)} ${fmt.change(r.value, 2)}`).join(', '),
    )
    .with({ kind: 'number' }, (f) => f.text)
    .exhaustive();

export function FigureView({ figure }: { readonly figure: Figure }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const { ref, width } = useChartWidth<HTMLDivElement>();
  return (
    <div ref={ref} role="img" aria-label={figureLabel(figure, t, fmt)} className="w-full">
      {width > 0 &&
        match(figure)
          .with({ kind: 'price' }, (f) => <PriceFigure figure={f} width={width} />)
          .with({ kind: 'ratio' }, (f) => <RatioFigure value={f.value} width={width} />)
          .with({ kind: 'scale' }, (f) => <ScaleFigure scale={f} width={width} />)
          .with({ kind: 'breadth' }, (f) => <BreadthFigure figure={f} width={width} />)
          .with({ kind: 'compare' }, (f) => <CompareFigure figure={f} />)
          .with({ kind: 'number' }, (f) => (
            <p className="font-figure font-semibold text-foreground text-xl">{f.text}</p>
          ))
          .exhaustive()}
    </div>
  );
}
