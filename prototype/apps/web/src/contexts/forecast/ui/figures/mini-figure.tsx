import type { Figure } from '@reinforce/server/dto';
import { chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { MINI, type MiniFigure as Mini, miniFigure, stackTop } from '../../domain/mini-vm';

const HOT = chartSeriesVars[0];
const PAST = 'fill-foreground/32';
const REST = 'fill-foreground/13';
const MIDDLE = MINI.height / 2;
const ROUND = MINI.bar / 2;
const PAIR_TOP = stackTop(2, MINI.gap);

const partClass = (key: 'up' | 'flat' | 'down'): string | undefined =>
  match(key)
    .with('up', () => undefined)
    .with('flat', () => REST)
    .with('down', () => PAST)
    .exhaustive();

export function MiniFigure({ figure, className }: { readonly figure: Figure; readonly className?: string }) {
  const mini = miniFigure(figure);
  return mini === null ? null : <MiniShape mini={mini} className={className} />;
}

export function MiniShape({ mini, className }: { readonly mini: Mini; readonly className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MINI.width} ${MINI.height}`}
      aria-hidden
      className={cn('block h-auto shrink-0 overflow-visible', className)}
    >
      {match(mini)
        .with({ kind: 'price' }, (m) => (
          <>
            {m.before && (
              <path
                d={m.before}
                fill="none"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="stroke-foreground/32"
              />
            )}
            {m.marked && (
              <path
                d={m.marked}
                fill="none"
                stroke={HOT}
                strokeWidth={1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <circle cx={m.end.x} cy={m.end.y} r={2.2} fill={HOT} />
          </>
        ))
        .with({ kind: 'scale' }, (m) => (
          <>
            <rect
              x={m.track.x}
              y={MIDDLE - MINI.track / 2}
              width={m.track.width}
              height={MINI.track}
              rx={MINI.track / 2}
              className={REST}
            />
            {m.zones.map((zone) => (
              <rect
                key={zone.x}
                x={zone.x}
                y={MIDDLE - MINI.track / 2}
                width={zone.width}
                height={MINI.track}
                rx={MINI.track / 2}
                className={PAST}
              />
            ))}
            {m.from !== null && (
              <line
                x1={m.from}
                x2={m.now}
                y1={MIDDLE}
                y2={MIDDLE}
                stroke={HOT}
                strokeWidth={1.75}
                strokeLinecap="round"
              />
            )}
            <circle cx={m.now} cy={MIDDLE} r={3} fill={HOT} />
          </>
        ))
        .with({ kind: 'ratio' }, (m) => (
          <>
            <rect x={0} y={PAIR_TOP} width={m.usual} height={MINI.bar} rx={ROUND} className={PAST} />
            <rect
              x={0}
              y={PAIR_TOP + MINI.bar + MINI.gap}
              width={m.now}
              height={MINI.bar}
              rx={ROUND}
              fill={HOT}
            />
          </>
        ))
        .with({ kind: 'breadth' }, (m) =>
          m.parts.map((part) => (
            <rect
              key={part.key}
              x={part.x}
              y={stackTop(1, 0)}
              width={part.width}
              height={MINI.bar}
              rx={ROUND}
              fill={part.key === 'up' ? HOT : undefined}
              className={partClass(part.key)}
            />
          )),
        )
        .with({ kind: 'compare' }, (m) => (
          <>
            <line
              x1={m.center}
              x2={m.center}
              y1={MINI.inset - 1}
              y2={MINI.height - MINI.inset + 1}
              className="stroke-foreground/13"
            />
            {m.bars.map((bar, i) => (
              <rect
                key={bar.label}
                x={bar.x}
                y={stackTop(m.bars.length, MINI.split) + i * (MINI.bar + MINI.split)}
                width={bar.width}
                height={MINI.bar}
                rx={ROUND}
                fill={bar.own ? HOT : undefined}
                className={bar.own ? undefined : PAST}
              />
            ))}
          </>
        ))
        .with({ kind: 'odds' }, (m) =>
          m.parts.map((part) => (
            <rect
              key={part.cls}
              x={part.x}
              y={stackTop(1, 0)}
              width={part.width}
              height={MINI.bar}
              rx={ROUND}
              fill={part.lead ? HOT : undefined}
              className={part.lead ? undefined : PAST}
            />
          )),
        )
        .exhaustive()}
    </svg>
  );
}
