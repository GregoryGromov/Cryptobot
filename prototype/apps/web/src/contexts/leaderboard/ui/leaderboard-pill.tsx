import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Trophy } from 'lucide-react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { useStandings } from '../api/use-standings';
import { standingsView } from '../domain/standings-vm';
import { RankDelta } from './rank-marks';

const SEP = 'h-4 w-px shrink-0 bg-foreground/12';

export function LeaderboardPill({ className }: { readonly className?: string }) {
  const { t } = useT('leaderboard');
  const fmt = useFormatters();
  const { standings, now } = useStandings();
  const view = standingsView(standings, now);
  return (
    <Link
      to="/leaderboard"
      className={cn(
        'glass-island focus-ring group flex h-11 items-center gap-3 rounded-full ps-3.5 pe-1.5 text-foreground-soft text-sm transition-colors hover:text-foreground motion-reduce:transition-none',
        className,
      )}
    >
      <Trophy aria-hidden className="size-4.5 shrink-0 text-accent" strokeWidth={1.75} />
      <span className="whitespace-nowrap">
        <span className="font-medium text-foreground">{t('pill.label')}</span>
        {view.left !== null && (
          <span className="max-lg:hidden">
            {' · '}
            {t('left', view.left)}
          </span>
        )}
      </span>
      <span aria-hidden className={SEP} />
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="max-sm:hidden">{t('pill.you')}</span>
        <span className="font-figure font-semibold text-foreground">
          {t('place.figure', { rank: view.me.rank })}
        </span>
        <RankDelta delta={view.me.rankDelta} />
      </span>
      {view.next !== null && (
        <>
          <span aria-hidden className={cn(SEP, 'max-xl:hidden')} />
          <span className="whitespace-nowrap max-xl:hidden">
            {t('pill.toNext', { rank: view.next.rank })}{' '}
            <span className="font-figure font-semibold text-foreground">{fmt.change(view.next.gap, 1)}</span>
          </span>
        </>
      )}
      <span className="flex h-8 items-center gap-0.5 rounded-full bg-foreground/7 ps-3 pe-1.5 font-medium text-foreground transition-colors group-hover:bg-foreground/10 max-sm:ps-1.5">
        <span className="max-sm:sr-only">{t('pill.go')}</span>
        <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
      </span>
    </Link>
  );
}

export function LeaderboardPlace() {
  const { t } = useT('leaderboard');
  const { standings, now } = useStandings();
  const view = standingsView(standings, now);
  return <>{t('place.figure', { rank: view.me.rank })}</>;
}
