import type { SignalView } from '@reinforce/server/dto';

const SOON_MS = 5 * 60_000;

type Lived = Pick<SignalView, 'eventAt' | 'staleAt'>;

export type SignalLife = {
  readonly clock: string;
  readonly share: number;
  readonly soon: boolean;
};

export const signalLife = (signal: Lived, now: number): SignalLife | null => {
  const left = signal.staleAt - now;
  if (left <= 0) return null;
  const seconds = Math.ceil(left / 1000);
  const span = signal.staleAt - signal.eventAt;
  return {
    clock: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    share: span > 0 ? Math.min(1, left / span) : 1,
    soon: left < SOON_MS,
  };
};

export const lifeMinutes = (signal: Lived): number => Math.round((signal.staleAt - signal.eventAt) / 60_000);
