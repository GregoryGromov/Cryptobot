import { match } from 'ts-pattern';

export const TOUR_BEATS = ['signal', 'forecast', 'why', 'risk', 'open', 'payoff'] as const;

export type TourBeat = (typeof TOUR_BEATS)[number];

export type TourAsk = 'where' | 'why' | 'risk' | 'open';

/** What the person says to start a beat; the first beat and the time skip come by themselves. */
export const askOf = (beat: TourBeat): TourAsk | null =>
  match(beat)
    .with('signal', 'payoff', () => null)
    .with('forecast', () => 'where' as const)
    .with('why', () => 'why' as const)
    .with('risk', () => 'risk' as const)
    .with('open', () => 'open' as const)
    .exhaustive();

export type TourState = {
  readonly at: number;
  readonly way: 1 | -1;
  /** Counts every step, so a beat played again after «back» starts its clock afresh. */
  readonly run: number;
  readonly leaving: boolean;
};

export type TourEvent = { readonly type: 'next' } | { readonly type: 'back' } | { readonly type: 'skip' };

export const TOUR_START: TourState = { at: 0, way: 1, run: 0, leaving: false };

const LAST = TOUR_BEATS.length - 1;

export const tourReducer = (state: TourState, event: TourEvent): TourState =>
  match([state, event] as const)
    .with([{ leaving: true }, { type: 'next' }], [{ leaving: true }, { type: 'back' }], ([now]) => now)
    .with([{ leaving: false }, { type: 'next' }], ([now]) =>
      now.at >= LAST
        ? { ...now, leaving: true }
        : { at: now.at + 1, way: 1 as const, run: now.run + 1, leaving: false },
    )
    .with([{ leaving: false }, { type: 'back' }], ([now]) =>
      now.at === 0 ? now : { at: now.at - 1, way: -1 as const, run: now.run + 1, leaving: false },
    )
    .with([{}, { type: 'skip' }], ([now]) => ({ ...now, leaving: true }))
    .exhaustive();

export const beatAt = (index: number): TourBeat | null => TOUR_BEATS[index] ?? null;

/** The made-up trade the tour tells: a short on BTC after a sharp fall, closed at its target. */
export const DEMO = {
  coin: 'BTC',
  amount: 2_000,
  entry: 67_400,
  stop: 67_700,
  take: 66_800,
  horizon: 5,
  signalMove: 0.8,
  signalTimes: 4,
  hourChange: -1.2,
  volume: 4.2,
  /** Tenths of the ten ticks that go to «down», «flat» and «up». */
  odds: { p_down: 0.7, p_flat: 0.2, p_up: 0.1 },
  /** Seconds after the entry the price reaches the target. */
  closedAfter: 260,
} as const;

/** What a short of `amount` dollars makes as the price goes from `entry` to `exit`; negative is a loss. */
export const shortResult = (amount: number, entry: number, exit: number): number =>
  (amount * (entry - exit)) / entry;

export const DEMO_GAIN = shortResult(DEMO.amount, DEMO.entry, DEMO.take);

export const DEMO_LOSS = -shortResult(DEMO.amount, DEMO.entry, DEMO.stop);

/** BTC's last minutes before the entry: calm, then the fall the signal caught. */
export const DEMO_BEFORE = [
  67_930, 67_955, 67_940, 67_962, 67_948, 67_970, 67_952, 67_938, 67_960, 67_944, 67_880, 67_760, 67_640,
  67_520, 67_400,
] as const;

/** From the entry to the target, every ten seconds: a short bounce first, then down. */
export const DEMO_AFTER = [
  67_400, 67_432, 67_410, 67_368, 67_395, 67_330, 67_290, 67_312, 67_240, 67_205, 67_228, 67_150, 67_118,
  67_140, 67_070, 67_030, 67_052, 66_990, 66_955, 66_972, 66_910, 66_880, 66_898, 66_850, 66_826, 66_840,
  66_800,
] as const;

/** Where the price stands a `share` of the way from the entry to the close, between the ten-second points. */
export const priceAt = (share: number): number => {
  const steps = DEMO_AFTER.length - 1;
  const at = Math.min(steps, Math.max(0, share * steps));
  const low = Math.floor(at);
  const from = DEMO_AFTER[low] ?? DEMO.entry;
  const to = DEMO_AFTER[Math.min(steps, low + 1)] ?? from;
  return from + (to - from) * (at - low);
};
