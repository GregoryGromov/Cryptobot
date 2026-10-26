export type EntrantModel = 'Grok' | 'GPT' | 'Claude';

export type Entrant = {
  readonly id: string;
  readonly handle: string | null;
  readonly model: EntrantModel;
  readonly rank: number;
  readonly returnPct: number;
  readonly rankDelta: number;
  readonly curve: readonly number[];
};

export type Standings = {
  readonly startsAt: number;
  readonly endsAt: number;
  readonly total: number;
  readonly entrants: readonly Entrant[];
  readonly benchmark: { readonly coin: string; readonly ticker: string; readonly curve: readonly number[] };
};

export const ME = 'me';

const DAY = 86_400_000;
const DAYS_BEHIND = 8;
const LENGTH_DAYS = 14;
const STEPS = 64;

type Seed = readonly [string | null, EntrantModel, number, number, number];

const SEEDS: readonly Seed[] = [
  ['nightowl_sol', 'Claude', 1, 31.4, 1],
  ['kira.trades', 'GPT', 2, 27.9, -1],
  ['degen_dima', 'Grok', 3, 24.1, 4],
  ['mark_ai', 'Claude', 4, 19.6, 0],
  ['lenka', 'Grok', 5, 17.2, 2],
  ['misha_k', 'GPT', 35, 5.6, 1],
  ['vera.eth', 'Grok', 36, 5.1, -2],
  [null, 'Grok', 37, 4.8, 3],
  ['den_crypto', 'Claude', 38, 4.4, -1],
  ['yulia', 'GPT', 39, 4.0, 6],
];

const random = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export function demoCurve(final: number, seed: number, swing: number): readonly number[] {
  const next = random(seed);
  const walk = [0];
  for (let i = 1; i < STEPS; i += 1) walk.push((walk[i - 1] ?? 0) + (next() - 0.5) * swing);
  const smooth = walk.map((_, i) => {
    const near = walk.slice(Math.max(0, i - 2), i + 3);
    return near.reduce((sum, value) => sum + value, 0) / near.length;
  });
  const first = smooth[0] ?? 0;
  const last = (smooth.at(-1) ?? 0) - first;
  return smooth.map((value, i) => value - first + (final - last) * (i / (STEPS - 1)));
}

const startOfDay = (at: number): number => {
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

export function demoStandings(now: number): Standings {
  const startsAt = startOfDay(now) - DAYS_BEHIND * DAY;
  return {
    startsAt,
    endsAt: startsAt + LENGTH_DAYS * DAY,
    total: 412,
    entrants: SEEDS.map(([handle, model, rank, returnPct, rankDelta]) => ({
      id: handle ?? ME,
      handle,
      model,
      rank,
      returnPct,
      rankDelta,
      curve: demoCurve(returnPct, rank * 7919, 1.2 + Math.abs(returnPct) * 0.08),
    })),
    benchmark: { coin: 'BTC', ticker: 'BTC', curve: demoCurve(1.9, 31, 1.6) },
  };
}
