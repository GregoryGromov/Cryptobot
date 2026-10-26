import { match } from 'ts-pattern';
import { type Entrant, ME, type Standings } from './demo-standings';

export const RACE_MODES = ['leaders', 'neighbors'] as const;

export type RaceMode = (typeof RACE_MODES)[number];

export type RaceLine = {
  readonly id: string;
  readonly kind: 'me' | 'rival' | 'benchmark';
  readonly entrant: Entrant | null;
  readonly curve: readonly number[];
  readonly last: number;
};

export type StandingsView = {
  readonly me: Entrant;
  readonly total: number;
  readonly betterThan: number;
  readonly next: { readonly rank: number; readonly gap: number; readonly entrant: Entrant } | null;
  readonly podium: readonly Entrant[];
  readonly around: readonly Entrant[];
  readonly hidden: number;
  readonly left: { readonly days: number; readonly hours: number } | null;
};

const HOUR = 3_600_000;
const NEAR = 2;
const PODIUM = 3;
const LEADERS = 5;

const byRank = (a: Entrant, b: Entrant): number => a.rank - b.rank;

export const meOf = (standings: Standings): Entrant => {
  const me = standings.entrants.find((entrant) => entrant.id === ME);
  if (me === undefined) throw new Error('standings without the person');
  return me;
};

export function standingsView(standings: Standings, now: number): StandingsView {
  const me = meOf(standings);
  const ranked = [...standings.entrants].sort(byRank);
  const ahead = ranked.find((entrant) => entrant.rank === me.rank - 1);
  const podium = ranked.filter((entrant) => entrant.rank <= PODIUM);
  const around = ranked.filter(
    (entrant) => entrant.rank > PODIUM && Math.abs(entrant.rank - me.rank) <= NEAR,
  );
  const lastShown = podium.at(-1)?.rank ?? 0;
  const firstAround = around[0]?.rank ?? lastShown + 1;
  const leftMs = standings.endsAt - now;
  const hours = Math.floor(leftMs / HOUR);
  return {
    me,
    total: standings.total,
    betterThan: Math.floor(((standings.total - me.rank) / standings.total) * 100),
    next:
      ahead === undefined ? null : { rank: ahead.rank, gap: ahead.returnPct - me.returnPct, entrant: ahead },
    podium,
    around,
    hidden: Math.max(0, firstAround - lastShown - 1),
    left: leftMs <= 0 ? null : { days: Math.floor(hours / 24), hours: hours % 24 },
  };
}

const lineOf = (entrant: Entrant): RaceLine => ({
  id: entrant.id,
  kind: entrant.id === ME ? 'me' : 'rival',
  entrant,
  curve: entrant.curve,
  last: entrant.curve.at(-1) ?? 0,
});

export function raceLines(standings: Standings, mode: RaceMode): readonly RaceLine[] {
  const me = meOf(standings);
  const ranked = [...standings.entrants].sort(byRank);
  const rivals = match(mode)
    .with('leaders', () => ranked.filter((entrant) => entrant.rank <= LEADERS))
    .with('neighbors', () =>
      ranked.filter((entrant) => entrant.id !== ME && Math.abs(entrant.rank - me.rank) <= NEAR),
    )
    .exhaustive();
  const benchmark: RaceLine = {
    id: standings.benchmark.coin,
    kind: 'benchmark',
    entrant: null,
    curve: standings.benchmark.curve,
    last: standings.benchmark.curve.at(-1) ?? 0,
  };
  return [...rivals.filter((entrant) => entrant.id !== ME).map(lineOf), benchmark, lineOf(me)];
}

export function spreadLabels(
  ys: readonly number[],
  gap: number,
  top: number,
  bottom: number,
): readonly number[] {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  const placed: number[] = [];
  for (const [i, item] of order.entries()) {
    const floor = i === 0 ? top : (placed[i - 1] ?? top) + gap;
    placed.push(Math.max(item.y, floor));
  }
  for (let i = placed.length - 1; i >= 0; i -= 1) {
    const ceiling = i === placed.length - 1 ? bottom : (placed[i + 1] ?? bottom) - gap;
    placed[i] = Math.min(placed[i] ?? 0, ceiling);
  }
  const result = new Array<number>(ys.length).fill(0);
  for (const [i, item] of order.entries()) result[item.index] = placed[i] ?? item.y;
  return result;
}
