import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { type Entrant, ME } from '../domain/demo-standings';
import type { StandingsView } from '../domain/standings-vm';
import { EntrantAvatar, useEntrantName } from './entrant-avatar';
import { EntrantSpark } from './entrant-spark';
import { RankDelta, RankMark } from './rank-marks';

const ROW_CLASS =
  'grid h-14 grid-cols-[2rem_minmax(0,1fr)_4.75rem_2.5rem] items-center gap-2.5 rounded-xl px-2.5 transition-colors duration-200 motion-reduce:transition-none sm:grid-cols-[2.25rem_minmax(0,1fr)_6rem_6rem_3.25rem] sm:gap-4 sm:px-3';

function EntrantRow({
  entrant,
  lit,
  onLit,
}: {
  readonly entrant: Entrant;
  readonly lit: string | null;
  readonly onLit: (id: string | null) => void;
}) {
  const fmt = useFormatters();
  const nameOf = useEntrantName();
  const mine = entrant.id === ME;
  return (
    <li
      onPointerEnter={() => onLit(entrant.id)}
      onPointerLeave={() => onLit(null)}
      className={cn(
        ROW_CLASS,
        mine ? 'bg-foreground/7 ring-1 ring-foreground/6 ring-inset' : 'hover:bg-foreground/4',
      )}
    >
      <RankMark rank={entrant.rank} mine={mine} />
      <span className="flex min-w-0 items-center gap-3">
        <EntrantAvatar entrant={entrant} />
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate text-row',
              mine ? 'font-semibold text-foreground' : 'font-medium text-foreground',
            )}
          >
            {nameOf(entrant)}
          </span>
          <span className="text-muted-foreground text-xs">{entrant.model}</span>
        </span>
      </span>
      <EntrantSpark
        curve={entrant.curve}
        tone={mine ? 'mine' : lit === entrant.id ? 'lit' : 'rest'}
        className="justify-self-end max-sm:hidden"
      />
      <Numeral
        tone="direction"
        direction={directionOf(entrant.returnPct, 1)}
        weight="medium"
        className="justify-self-end font-figure text-row"
      >
        {fmt.change(entrant.returnPct, 1)}
      </Numeral>
      <RankDelta delta={entrant.rankDelta} className="justify-self-end" />
    </li>
  );
}

export function StandingsList({
  view,
  lit,
  onLit,
}: {
  readonly view: StandingsView;
  readonly lit: string | null;
  readonly onLit: (id: string | null) => void;
}) {
  const { t } = useT('leaderboard');
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn(cardVariants({ size: 'sm' }), 'gap-0 px-1.5 py-1.5 sm:px-2 sm:py-2')}
    >
      <h2 id={id} className="sr-only">
        {t('list.label')}
      </h2>
      <ol className="flex flex-col gap-0.5">
        {view.podium.map((entrant) => (
          <EntrantRow key={entrant.id} entrant={entrant} lit={lit} onLit={onLit} />
        ))}
        {view.hidden > 0 && (
          <li className="flex items-center gap-3 px-3 py-2 text-muted-foreground text-xs">
            <span aria-hidden className="h-px flex-1 border-foreground/10 border-t border-dashed" />
            {t('list.more', { count: view.hidden })}
            <span aria-hidden className="h-px flex-1 border-foreground/10 border-t border-dashed" />
          </li>
        )}
        {view.around.map((entrant) => (
          <EntrantRow key={entrant.id} entrant={entrant} lit={lit} onLit={onLit} />
        ))}
      </ol>
    </section>
  );
}
