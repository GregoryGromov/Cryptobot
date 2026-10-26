import { createFileRoute } from '@tanstack/react-router';
import { leaderboardSearch } from '~/contexts/leaderboard/domain/leaderboard-search';
import { LeaderboardPage } from '~/contexts/leaderboard/ui/leaderboard-page';

export const Route = createFileRoute('/leaderboard')({
  validateSearch: leaderboardSearch,
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  return <LeaderboardPage search={Route.useSearch()} />;
}
