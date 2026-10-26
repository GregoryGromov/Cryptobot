import { Heading, Text } from '@reinforce/ui-react/typography';
import { useState } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { dataColumnClass } from '~/shared/ui/page-column';
import { useStandings } from '../api/use-standings';
import type { LeaderboardSearch } from '../domain/leaderboard-search';
import { standingsView } from '../domain/standings-vm';
import { RaceCard } from './race-card';
import { StandingsList } from './standings-list';

export function LeaderboardPage({ search }: { readonly search: LeaderboardSearch }) {
  const { t } = useT('leaderboard');
  const fmt = useFormatters();
  const { standings, now } = useStandings();
  const view = standingsView(standings, now);
  const [lit, setLit] = useState<string | null>(null);
  return (
    <div className={dataColumnClass}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading as="h1" size="page">
          {t('title')}
        </Heading>
        <Text variant="muted" className="text-meta">
          {t('finish', { day: fmt.day(standings.endsAt) })}
          {' · '}
          <span className="font-medium text-foreground-soft">
            {view.left === null ? t('over') : t('left', view.left)}
          </span>
        </Text>
      </header>
      <RaceCard standings={standings} view={view} mode={search.race ?? 'leaders'} now={now} lit={lit} />
      <StandingsList view={view} lit={lit} onLit={setLit} />
      <p className="px-1 text-muted-foreground text-xs">{t('rules')}</p>
    </div>
  );
}
