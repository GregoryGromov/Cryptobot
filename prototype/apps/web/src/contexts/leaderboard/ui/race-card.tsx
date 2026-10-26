import { stageClass } from '@reinforce/ui-primitives/card';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import type { Standings } from '../domain/demo-standings';
import { RACE_MODES, type RaceMode, raceLines, type StandingsView } from '../domain/standings-vm';
import { useEntrantName } from './entrant-avatar';
import { RaceChart } from './race-chart';
import { RankDelta } from './rank-marks';

const FIGURE_CLASS =
  'font-figure font-semibold text-2xl leading-8 tracking-[-0.02em] sm:text-[2rem] sm:leading-10';

const isMode = (value: string): value is RaceMode => RACE_MODES.some((mode) => mode === value);

function Stat({
  label,
  figure,
  sub,
}: {
  readonly label: string;
  readonly figure: ReactNode;
  readonly sub: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-meta text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1">
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">{figure}</span>
        <span className="text-meta text-muted-foreground">{sub}</span>
      </dd>
    </div>
  );
}

function RaceStats({ view }: { readonly view: StandingsView }) {
  const { t } = useT('leaderboard');
  const fmt = useFormatters();
  const nameOf = useEntrantName();
  const ahead = view.next;
  return (
    <dl className="grid grid-cols-3 gap-x-5 sm:gap-x-12">
      <Stat
        label={t('place.label')}
        figure={
          <>
            <span className={cn(FIGURE_CLASS, 'text-foreground')}>
              {t('place.figure', { rank: view.me.rank })}
            </span>
            <span className="text-meta text-muted-foreground">
              {t('place.of', { total: fmt.int(view.total) })}
            </span>
          </>
        }
        sub={
          <span className="inline-flex items-center gap-1.5">
            <RankDelta delta={view.me.rankDelta} />
            <span className="max-sm:hidden">{t('place.day')}</span>
          </span>
        }
      />
      <Stat
        label={t('return.label')}
        figure={
          <Numeral tone="direction" direction={directionOf(view.me.returnPct, 1)} className={FIGURE_CLASS}>
            {fmt.change(view.me.returnPct, 1)}
          </Numeral>
        }
        sub={t('return.better', { share: fmt.percent(view.betterThan, 0) })}
      />
      <Stat
        label={ahead === null ? t('next.first') : t('next.label', { rank: ahead.rank })}
        figure={
          ahead !== null && (
            <span className={cn(FIGURE_CLASS, 'text-foreground')}>{fmt.change(ahead.gap, 1)}</span>
          )
        }
        sub={ahead !== null && nameOf(ahead.entrant)}
      />
    </dl>
  );
}

export function RaceCard({
  standings,
  view,
  mode,
  now,
  lit,
}: {
  readonly standings: Standings;
  readonly view: StandingsView;
  readonly mode: RaceMode;
  readonly now: number;
  readonly lit: string | null;
}) {
  const { t } = useT('leaderboard');
  const navigate = useNavigate({ from: '/leaderboard' });
  const id = useId();
  const choose = (value: string) => {
    if (!isMode(value)) return;
    void navigate({
      search: (prev) => ({ ...prev, race: value === 'leaders' ? undefined : value }),
      replace: true,
      resetScroll: false,
    });
  };
  return (
    <section aria-labelledby={id} className={cn(stageClass, 'flex flex-col gap-6 p-4 sm:p-6')}>
      <h2 id={id} className="sr-only">
        {t('race.title')}
      </h2>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <RaceStats view={view} />
        <ToggleGroup type="single" aria-label={t('race.mode')} value={mode} onValueChange={choose}>
          {RACE_MODES.map((option) => (
            <ToggleGroupItem key={option} value={option} size="sm" className="px-3">
              {t(`race.modes.${option}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <RaceChart
        key={mode}
        standings={standings}
        lines={raceLines(standings, mode)}
        now={now}
        rank={view.me.rank}
        lit={lit}
      />
    </section>
  );
}
