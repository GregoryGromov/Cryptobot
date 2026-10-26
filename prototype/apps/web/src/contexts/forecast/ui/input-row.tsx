import type { InputRow } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { directionOf } from '~/shared/format/percent';
import { useT } from '~/shared/i18n';
import { tickerOf } from '~/shared/routing/topics';
import { useChartWidth } from '~/shared/ui/chart/use-chart-width';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';
import { BAR, type WindowBar, type WindowTone, windowBar } from '../domain/inputs-vm';
import { Track } from './figures/track';

export function InputRowView({
  row,
  anchor,
  cited,
  lit,
}: {
  readonly row: InputRow;
  readonly anchor: string;
  readonly cited: boolean;
  readonly lit: boolean;
}) {
  const { t } = useT('forecast');
  const coin = row.kind === 'windows' ? row.coin : null;
  return (
    <div
      id={anchor}
      data-lit={lit}
      className={cn(
        'flex scroll-m-24 flex-col gap-2 rounded-md border border-transparent px-2.5 py-2.5 transition-colors duration-200',
        lit && 'border-border-control bg-card shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-1.5 font-medium text-foreground text-sm">
            {coin && <CoinLogo coin={coin} ticker={tickerOf(coin)} size="sm" />}
            {row.label}
            {cited && <span className="font-normal text-muted-foreground text-xs">{t('data.cited')}</span>}
          </p>
          {row.hint && <p className="text-muted-foreground text-xs">{row.hint}</p>}
        </div>
        {row.kind !== 'windows' && (
          <p className="flex shrink-0 flex-col items-end text-end">
            <span className="font-figure font-medium text-foreground text-sm">{row.text}</span>
            {row.kind === 'scale' && row.was && (
              <span className="font-figure text-muted-foreground text-xs">
                {t('data.was', { was: row.was })}
              </span>
            )}
          </p>
        )}
      </div>
      {match(row)
        .with({ kind: 'windows' }, (r) => <Windows row={r} />)
        .with({ kind: 'scale' }, (r) => <ScaleTrack row={r} />)
        .with({ kind: 'value' }, () => null)
        .exhaustive()}
    </div>
  );
}

function Windows({ row }: { readonly row: Extract<InputRow, { kind: 'windows' }> }) {
  const values = row.cells.map((c) => c.value);
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2">
      {row.cells.map((cell) => (
        <li key={cell.label} className="flex items-center gap-2">
          <Bar tone={row.tone} bar={windowBar(row.tone, cell.value, values)} />
          <span className="flex min-w-0 flex-col">
            <span className="text-muted-foreground text-xs">{cell.label}</span>
            <span
              className={cn(
                'font-figure text-sm',
                row.tone === 'signed' ? directionClass(directionOf(cell.value, 2)) : 'text-foreground',
              )}
            >
              {cell.text}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Bar({ tone, bar }: { readonly tone: WindowTone; readonly bar: WindowBar }) {
  return (
    <svg
      width={BAR.width}
      height={BAR.height}
      viewBox={`0 0 ${BAR.width} ${BAR.height}`}
      aria-hidden
      className="shrink-0"
    >
      {match(bar)
        .with({ kind: 'ratio' }, (b) => (
          <>
            <rect
              x={0}
              y={b.y}
              width={BAR.width}
              height={b.height}
              rx={2}
              className={b.hot ? 'fill-foreground/70' : 'fill-foreground/25'}
            />
            <line x1={-2} x2={BAR.width + 2} y1={b.usual} y2={b.usual} className="stroke-foreground/50" />
          </>
        ))
        .with({ kind: 'share' }, (b) => (
          <>
            <rect x={0} y={0} width={BAR.width} height={BAR.height} rx={2} className="fill-foreground/8" />
            <rect x={0} y={b.y} width={BAR.width} height={b.height} rx={2} className="fill-foreground/45" />
          </>
        ))
        .with({ kind: 'signed' }, (b) => (
          <>
            <line
              x1={0}
              x2={BAR.width}
              y1={BAR.height / 2}
              y2={BAR.height / 2}
              className="stroke-foreground/25"
            />
            <rect
              x={2}
              y={b.y}
              width={BAR.width - 4}
              height={b.height}
              rx={1.5}
              className={match(b.sign)
                .with('up', () => (tone === 'signed' ? 'fill-up' : 'fill-foreground/45'))
                .with('down', () => (tone === 'signed' ? 'fill-down' : 'fill-foreground/45'))
                .with('none', () => 'fill-foreground/45')
                .exhaustive()}
            />
          </>
        ))
        .exhaustive()}
    </svg>
  );
}

function ScaleTrack({ row }: { readonly row: Extract<InputRow, { kind: 'scale' }> }) {
  const { ref, width } = useChartWidth<HTMLDivElement>();
  return (
    <div ref={ref} className="w-full">
      {width > 0 && <Track scale={row.scale} width={width} />}
    </div>
  );
}
