import type { FanGeometry } from './fan-vm';

const SPREAD_SHARE = 0.26;
const EDGE = 6;

export type ReadingFan = { readonly cone: string; readonly middle: string };

const at = (x: number, y: number): string => `${x.toFixed(1)},${y.toFixed(1)}`;

export const readingFan = (
  fan: Pick<FanGeometry, 'plotTop' | 'plotBottom' | 'plotRight' | 'origin'>,
): ReadingFan => {
  const { x, y } = fan.origin;
  const spread = (fan.plotBottom - fan.plotTop) * SPREAD_SHARE;
  const top = Math.max(fan.plotTop + EDGE, y - spread);
  const bottom = Math.min(fan.plotBottom - EDGE, y + spread);
  return {
    cone: `M${at(x, y)}L${at(fan.plotRight, top)}L${at(fan.plotRight, bottom)}Z`,
    middle: `M${at(x, y)}L${at(fan.plotRight, y)}`,
  };
};

const READ_MS = 2400;
const BEAM_PX = 64;

export const readDelay = (x: number, fan: Pick<FanGeometry, 'frame' | 't0X'>): number => {
  const left = fan.frame.padLeft;
  const width = Math.max(1, fan.t0X - left);
  return Math.round((Math.min(Math.max(x - left, 0), width) / (width + BEAM_PX)) * READ_MS);
};

export const readingBehind = (since: number | undefined, now: number): number | null =>
  since === undefined ? null : Math.max(0, now - since);
