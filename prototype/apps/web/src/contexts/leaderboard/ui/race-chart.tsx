import {
  chartAxisLabelClass,
  chartFrameClass,
  fittedTicks,
  linearScale,
  linePath,
} from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { useChartBoxSize } from '~/shared/ui/chart/use-chart-width';
import { CoinLogo } from '~/shared/ui/coin-logo';
import type { Standings } from '../domain/demo-standings';
import { type RaceLine, spreadLabels } from '../domain/standings-vm';
import { EntrantAvatar, useEntrantName } from './entrant-avatar';

const AXIS_LEFT = 44;
const AXIS_BOTTOM = 24;
const TOP = 12;
const LABEL_GAP = 28;
const LABEL_INSET = 10;
const NAMES_FROM = 560;
const LABEL_ROOM = { names: 188, figures: 120 } as const;
const DAY = 86_400_000;
const DAY_STEP = 2;
const DAY_EDGE = 12;

const strokeOf = (line: RaceLine, lit: string | null) =>
  match(line.kind)
    .with('me', () => ({ stroke: 'var(--chart-1)', width: 2.5, opacity: 1, dash: undefined }))
    .with('benchmark', () => ({ stroke: 'var(--foreground)', width: 1.25, opacity: 0.32, dash: '4 4' }))
    .with('rival', () => ({
      stroke: 'var(--foreground)',
      width: lit === line.id ? 2 : 1.5,
      opacity: lit === null ? 0.4 : lit === line.id ? 1 : 0.16,
      dash: undefined,
    }))
    .exhaustive();

export function RaceChart({
  standings,
  lines,
  now,
  rank,
  lit,
}: {
  readonly standings: Standings;
  readonly lines: readonly RaceLine[];
  readonly now: number;
  readonly rank: number;
  readonly lit: string | null;
}) {
  const { t } = useT('leaderboard');
  const fmt = useFormatters();
  const nameOf = useEntrantName();
  const { ref, size } = useChartBoxSize<HTMLDivElement>();
  const { width, height } = size;
  const names = width >= NAMES_FROM;
  const nowX = width - (names ? LABEL_ROOM.names : LABEL_ROOM.figures);
  const bottom = height - AXIS_BOTTOM;
  const until = Math.min(now, standings.endsAt);
  const x = linearScale([standings.startsAt, until], [AXIS_LEFT, nowX]);
  const values = lines.flatMap((line) => line.curve);
  const ticks = fittedTicks({ lo: Math.min(0, ...values), hi: Math.max(0, ...values), count: 4, minSpan: 4 });
  const y = linearScale(ticks.domain, [bottom, TOP]);
  const labelYs = spreadLabels(
    lines.map((line) => y(line.last)),
    LABEL_GAP,
    TOP + LABEL_GAP / 2,
    bottom - LABEL_GAP / 2,
  );
  const days = Array.from(
    { length: Math.floor((until - standings.startsAt) / (DAY * DAY_STEP)) + 1 },
    (_, index) => standings.startsAt + index * DAY_STEP * DAY,
  ).filter((at) => x(at) <= nowX - DAY_EDGE);
  const leader = Math.max(...lines.filter((line) => line.kind === 'rival').map((line) => line.last));
  const mine = lines.find((line) => line.kind === 'me')?.last ?? 0;
  const benchmark = lines.find((line) => line.kind === 'benchmark')?.last ?? 0;
  const summary = t('race.summary', {
    from: fmt.day(standings.startsAt),
    mine: fmt.change(mine, 1),
    best: fmt.change(Math.max(leader, mine), 1),
    benchmark: fmt.change(benchmark, 1),
  });
  return (
    <div ref={ref} role="img" aria-label={summary} className={cn(chartFrameClass, 'h-60 sm:h-80')}>
      {width > 0 && height > 0 && (
        <>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0"
            aria-hidden
          >
            {ticks.ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={AXIS_LEFT}
                  x2={nowX}
                  y1={y(tick)}
                  y2={y(tick)}
                  strokeDasharray={tick === 0 ? '3 4' : undefined}
                  className={tick === 0 ? 'stroke-foreground/22' : 'stroke-foreground/7'}
                />
                <text x={0} y={y(tick) + 4} className={chartAxisLabelClass}>
                  {fmt.change(tick, 0)}
                </text>
              </g>
            ))}
            {days.map((at) => (
              <text key={at} x={x(at)} y={height - 6} textAnchor="middle" className={chartAxisLabelClass}>
                {fmt.int(new Date(at).getDate())}
              </text>
            ))}
          </svg>
          <div className="absolute inset-0 motion-safe:animate-[reveal-right_900ms_cubic-bezier(0.33,1,0.68,1)_both]">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
              {lines.map((line) => {
                const stroke = strokeOf(line, lit);
                const step = linearScale([0, line.curve.length - 1], [AXIS_LEFT, nowX]);
                return (
                  <path
                    key={line.id}
                    d={linePath(line.curve, step, y)}
                    fill="none"
                    stroke={stroke.stroke}
                    strokeWidth={stroke.width}
                    strokeOpacity={stroke.opacity}
                    strokeDasharray={stroke.dash}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="transition-[stroke-opacity,stroke-width] duration-200 motion-reduce:transition-none"
                  />
                );
              })}
            </svg>
          </div>
          {lines.map((line, index) => (
            <div
              key={line.id}
              style={{ top: labelYs[index] ?? 0, left: nowX + LABEL_INSET }}
              className={cn(
                'absolute flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap text-meta transition-opacity duration-200',
                'motion-safe:fade-in fill-mode-both motion-safe:animate-in motion-safe:delay-750 motion-safe:duration-200',
                lit !== null && lit !== line.id && line.kind === 'rival' && 'opacity-40',
              )}
            >
              {match(line)
                .with({ kind: 'me' }, () => (
                  <span className="-ms-1 flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--chart-1)_20%,transparent)] px-2.5 py-0.5 font-semibold text-foreground ring-1 ring-[color-mix(in_oklab,var(--chart-1)_45%,transparent)] ring-inset">
                    {names ? t('race.me', { rank }) : t('place.figure', { rank })}
                    <span className="font-figure">{fmt.change(line.last, 1)}</span>
                  </span>
                ))
                .with({ kind: 'benchmark' }, () => (
                  <>
                    <CoinLogo coin={standings.benchmark.coin} ticker={standings.benchmark.ticker} size="sm" />
                    {names && <span className="text-muted-foreground">{standings.benchmark.ticker}</span>}
                    <span className="font-figure text-muted-foreground">{fmt.change(line.last, 1)}</span>
                  </>
                ))
                .with({ kind: 'rival' }, () => (
                  <>
                    {line.entrant !== null && <EntrantAvatar entrant={line.entrant} size="sm" />}
                    {names && line.entrant !== null && (
                      <span className={lit === line.id ? 'text-foreground' : 'text-foreground-soft'}>
                        {nameOf(line.entrant)}
                      </span>
                    )}
                    <span
                      className={cn(
                        'font-figure',
                        lit === line.id ? 'text-foreground' : 'text-foreground-soft',
                      )}
                    >
                      {fmt.change(line.last, 1)}
                    </span>
                  </>
                ))
                .exhaustive()}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
