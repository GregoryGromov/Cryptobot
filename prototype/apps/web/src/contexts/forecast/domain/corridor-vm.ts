import type { HorizonNote } from '@reinforce/server/dto';

const EDGE = 4;
const NEAR_EDGE = 18;

export type Corridor = {
  readonly lo: number;
  readonly mid: number;
  readonly hi: number;
  readonly start: number;
  readonly anchor: 'start' | 'middle' | 'end';
};

export const corridor = (h: Pick<HorizonNote, 'q10' | 'expected' | 'q90'>): Corridor => {
  const min = Math.min(h.q10, h.expected, 0);
  const max = Math.max(h.q90, h.expected, 0);
  const span = max - min || 1;
  const at = (value: number): number => EDGE + ((value - min) / span) * (100 - 2 * EDGE);
  const mid = at(h.expected);
  const side = mid > 100 - NEAR_EDGE ? 'end' : 'middle';
  return { lo: at(h.q10), mid, hi: at(h.q90), start: at(0), anchor: mid < NEAR_EDGE ? 'start' : side };
};
