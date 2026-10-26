import type { Candle, TradeRow } from '@reinforce/server/dto';
import { chartAxisLabelClass, chartFrameClass, linearScale } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { useChartWidth } from '~/shared/ui/chart/use-chart-width';
import {
  type ChartLevel,
  type LevelKind,
  markersOf,
  type TradeChartVm,
  tradeChartVm,
} from '../domain/trade-chart-vm';

type ChartSize = 'compact' | 'full';

const MINUTE = 60_000;

const HEIGHT: Record<ChartSize, number> = { compact: 96, full: 220 };
const BOTTOM: Record<ChartSize, number> = { compact: 4, full: 22 };
const TOP = 6;

const levelTone = (kind: LevelKind): string =>
  match(kind)
    .with('stop', () => 'fill-down stroke-down')
    .with('take', () => 'fill-up stroke-up')
    .with('entry', () => 'fill-muted-foreground stroke-muted-foreground')
    .exhaustive();

const chartLabel = (
  t: TFunction<'trading'>,
  price: (value: number) => string,
  trade: TradeRow,
  market: string,
): string =>
  match(trade)
    .with({ status: 'open' }, (r) =>
      t('chart.label', {
        market,
        entry: price(r.entry.price),
        stop: price(r.stopPrice),
        take: price(r.takePrice),
      }),
    )
    .with({ status: 'closed' }, (r) =>
      t('chart.labelExit', {
        market,
        entry: price(r.entry.price),
        stop: price(r.stopPrice),
        take: price(r.takePrice),
        exit: price(r.exit.price),
      }),
    )
    .with({ status: 'pending' }, { status: 'rejected' }, () => market)
    .exhaustive();

export function TradeChart({
  trade,
  candles,
  market,
  size,
}: {
  readonly trade: TradeRow;
  readonly candles: readonly Candle[];
  readonly market: string;
  readonly size: ChartSize;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const vm = tradeChartVm(trade, candles);
  if (vm.kind === 'empty')
    return <p className="py-6 text-center text-muted-foreground text-sm">{t('chart.none')}</p>;
  const height = HEIGHT[size];
  return (
    <div ref={ref} className={chartFrameClass} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={chartLabel(t, fmt.price, trade, market)}
        >
          <Plot vm={vm} candles={candles} width={width} size={size} trade={trade} />
        </svg>
      )}
    </div>
  );
}

function Plot({
  vm,
  candles,
  width,
  size,
  trade,
}: {
  readonly vm: Extract<TradeChartVm, { kind: 'candles' }>;
  readonly candles: readonly Candle[];
  readonly width: number;
  readonly size: ChartSize;
  readonly trade: TradeRow;
}) {
  const fmt = useFormatters();
  const height = HEIGHT[size];
  const x = linearScale([vm.from, vm.to], [0, width]);
  const y = linearScale(vm.domain, [height - BOTTOM[size], TOP]);
  const body = Math.max(1, (width / vm.minutes) * 0.6);
  return (
    <>
      {candles.map((c) => {
        const cx = x(c.t + MINUTE / 2);
        const tone = c.c >= c.o ? 'fill-up stroke-up' : 'fill-down stroke-down';
        return (
          <g key={c.t} className={cn(tone, 'opacity-80')}>
            <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} strokeWidth={1} />
            <rect
              x={cx - body / 2}
              y={Math.min(y(c.o), y(c.c))}
              width={body}
              height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
              strokeWidth={0}
            />
          </g>
        );
      })}
      {vm.levels.map((level) => (
        <Level key={level.kind} level={level} y={y(level.price)} width={width} height={height} size={size} />
      ))}
      {markersOf(trade).map((marker) => (
        <circle
          key={marker.kind}
          cx={x(marker.at)}
          cy={y(marker.price)}
          r={size === 'full' ? 4 : 3}
          className="fill-foreground stroke-2 stroke-background"
        />
      ))}
      {size === 'full' && (
        <>
          <text x={0} y={height - 6} className={chartAxisLabelClass}>
            {fmt.clock(vm.from)}
          </text>
          <text x={width} y={height - 6} textAnchor="end" className={chartAxisLabelClass}>
            {fmt.clock(vm.to)}
          </text>
        </>
      )}
    </>
  );
}

function Level({
  level,
  y,
  width,
  height,
  size,
}: {
  readonly level: ChartLevel;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly size: ChartSize;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const tone = levelTone(level.kind);
  const label = `${t(`levelAt.${level.kind}`, { price: fmt.price(level.price) })}${match(level.pinned)
    .with('above', () => ' ↑')
    .with('below', () => ' ↓')
    .with(null, () => '')
    .exhaustive()}`;
  const labelY = match(level.pinned)
    .with('above', () => TOP + 10)
    .with('below', () => height - BOTTOM[size] - 4)
    .with(null, () => y - 4)
    .exhaustive();
  return (
    <g className={tone}>
      {level.pinned === null && (
        <line
          x1={0}
          x2={width}
          y1={y}
          y2={y}
          strokeWidth={1}
          strokeDasharray={level.kind === 'entry' ? '3 3' : '6 4'}
          className="fill-none"
        />
      )}
      {size === 'full' && (
        <text
          x={width - 2}
          y={labelY}
          textAnchor="end"
          strokeWidth={0}
          className="font-figure font-medium text-[0.6875rem]"
        >
          {label}
        </text>
      )}
    </g>
  );
}
