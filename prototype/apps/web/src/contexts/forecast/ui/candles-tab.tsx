import type { Inputs } from '@reinforce/server/dto';
import { chartAxisLabelClass } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { useChartWidth } from '~/shared/ui/chart/use-chart-width';
import { CANDLES, candlesGeometry } from '../domain/inputs-vm';

const RISE_SPREAD_MS = 420;

// Opened in «Все данные», the candles rise one after another, left to right.
const riseClass =
  'origin-center [transform-box:fill-box] group-data-[shown=true]/section:motion-safe:animate-[candle-rise_480ms_cubic-bezier(0.2,0.7,0.2,1)_both]';

export function CandlesTab({ data }: { readonly data: Inputs }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const g = candlesGeometry(data.candles, width);
  const last = data.candles.at(-1);
  return (
    <div className="flex flex-col gap-2">
      <div ref={ref} className="w-full">
        {g && (
          <svg
            width="100%"
            height={g.height}
            viewBox={`0 0 ${width} ${g.height}`}
            role="img"
            aria-label={t('data.chart', {
              from: fmt.clock(g.from),
              to: fmt.clock(g.to),
              lo: fmt.price(g.lo),
              hi: fmt.price(g.hi),
            })}
            className="block"
          >
            {g.ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={CANDLES.inset}
                  x2={g.right}
                  y1={tick.y}
                  y2={tick.y}
                  className="stroke-foreground/8"
                />
                <text x={g.right + 8} y={tick.y + 3.5} className={chartAxisLabelClass}>
                  {fmt.decimal(tick.value, g.digits)}
                </text>
              </g>
            ))}
            {g.bars.map((bar, i) => (
              <g
                key={bar.key}
                style={{ animationDelay: `${Math.round((i / g.bars.length) * RISE_SPREAD_MS)}ms` }}
                className={cn(riseClass, bar.up ? 'text-up' : 'text-down')}
              >
                <line x1={bar.x} x2={bar.x} y1={bar.high} y2={bar.low} className="stroke-current" />
                <rect
                  x={bar.x - bar.body / 2}
                  y={bar.top}
                  width={bar.body}
                  height={Math.max(bar.bottom - bar.top, 1)}
                  className="fill-current"
                />
                <rect
                  x={bar.x - bar.body / 2}
                  y={bar.volumeY}
                  width={bar.body}
                  height={bar.volume}
                  className="fill-current opacity-35"
                />
              </g>
            ))}
            <text x={CANDLES.inset} y={g.height - 4} className={chartAxisLabelClass}>
              {fmt.clock(g.from)}
            </text>
            <text x={g.right} y={g.height - 4} textAnchor="end" className={chartAxisLabelClass}>
              {fmt.clock(g.to)}
            </text>
          </svg>
        )}
      </div>
      {last && (
        <p className="text-muted-foreground text-xs">
          {t('data.candles', { time: fmt.clock(last.t + 60_000) })}{' '}
          {data.quality.missing ? t('data.missing', { n: data.quality.missing }) : t('data.gaps')}
        </p>
      )}
    </div>
  );
}
