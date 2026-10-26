import type { SignalRow, SignalView } from '@reinforce/server/dto';
import { startOfDay } from '~/shared/format/time';

const WAVE_GAP_MS = 6 * 60_000;
const WAVE_SPAN_MS = 30 * 60_000;

export type Wave = {
  readonly key: string;
  readonly lead: SignalRow;
  readonly with: readonly SignalRow[];
  readonly staleAt: number;
};

type Gathering = {
  readonly members: SignalRow[];
  readonly latest: number;
  earliest: number;
  readonly direction: SignalRow['direction'];
  readonly broad: boolean;
};

const isBroad = (signal: Pick<SignalView, 'scope'>): boolean =>
  signal.scope === 'BROAD' || signal.scope === 'MARKET_WIDE';

const strength = (signal: Pick<SignalView, 'times' | 'move'>): number =>
  (signal.times ?? 0) * 100 + Math.abs(signal.move);

const underlying = (coin: string): string => coin.slice(coin.indexOf(':') + 1);

// The same market on two exchanges, `xyz:SNDK` and `io:SNDK`, fires as one: its twin adds nothing to the line.
const twins = (wave: Gathering, signal: SignalRow): boolean =>
  wave.direction === signal.direction &&
  wave.members.some(
    (member) =>
      underlying(member.coin) === underlying(signal.coin) &&
      Math.abs(member.eventAt - signal.eventAt) <= WAVE_GAP_MS,
  );

const joins = (wave: Gathering, signal: SignalRow): boolean =>
  wave.broad &&
  wave.direction === signal.direction &&
  wave.earliest - signal.eventAt <= WAVE_GAP_MS &&
  wave.latest - signal.eventAt <= WAVE_SPAN_MS;

export const wavesOf = (items: readonly SignalRow[]): readonly Wave[] => {
  const gathered: Gathering[] = [];
  for (const signal of [...items].sort((a, b) => b.eventAt - a.eventAt)) {
    if (gathered.some((wave) => twins(wave, signal))) continue;
    const broad = isBroad(signal);
    const wave = broad ? gathered.find((w) => joins(w, signal)) : undefined;
    if (wave === undefined) {
      gathered.push({
        members: [signal],
        latest: signal.eventAt,
        earliest: signal.eventAt,
        direction: signal.direction,
        broad,
      });
      continue;
    }
    if (!wave.members.some((m) => m.coin === signal.coin)) wave.members.push(signal);
    wave.earliest = Math.min(wave.earliest, signal.eventAt);
  }
  return gathered
    .flatMap((wave) => {
      const [lead, ...rest] = [...wave.members].sort((a, b) => strength(b) - strength(a));
      if (lead === undefined) return [];
      return [
        {
          key: lead.eventId,
          lead,
          with: rest,
          staleAt: Math.max(...wave.members.map((m) => m.staleAt)),
        },
      ];
    })
    .sort((a, b) => b.lead.eventAt - a.lead.eventAt);
};

export const isFresh = (signal: Pick<SignalView, 'staleAt'>, now: number): boolean => now < signal.staleAt;

const SINCE_AFTER_MS = 120_000;

export const sinceOf = (signal: Pick<SignalRow, 'since' | 'eventAt'>, now: number): number | null =>
  signal.since !== null && now - signal.eventAt > SINCE_AFTER_MS ? signal.since : null;

export const timesOf = (signal: Pick<SignalView, 'times'>): number | null => {
  const n = signal.times === null ? 0 : Math.round(signal.times);
  return n >= 2 ? n : null;
};

export const freshEarlier = (
  live: Pick<SignalRow, 'eventId'>,
  earlier: readonly SignalRow[],
  now: number,
): readonly SignalRow[] => earlier.filter((s) => s.eventId !== live.eventId && isFresh(s, now));

export type DayGroup<T> = { readonly day: number; readonly items: readonly T[] };

export const byDay = <T>(items: readonly T[], at: (item: T) => number): readonly DayGroup<T>[] => {
  const groups: { day: number; items: T[] }[] = [];
  for (const item of items) {
    const day = startOfDay(at(item));
    const last = groups.at(-1);
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
};
