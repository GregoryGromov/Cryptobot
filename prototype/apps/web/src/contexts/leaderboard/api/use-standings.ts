import { useServerNow } from '~/shared/api/live';
import { demoStandings, type Standings } from '../domain/demo-standings';

const TICK = 60_000;

export function useStandings(): { readonly standings: Standings; readonly now: number } {
  const now = useServerNow(TICK);
  return { standings: demoStandings(now), now };
}
