import type { ChartBoxSize } from './geometry.js';

export type TooltipPlacement = { readonly left: number; readonly top: number };

export type TooltipPlacementInput = {
  readonly frame: ChartBoxSize;
  readonly size: ChartBoxSize;
  readonly position: number;
  readonly avoidY: number | null;
};

const TOOLTIP_GAP = 12;
const TOOLTIP_INSET = 8;

export function placeTooltip({ frame, size, position, avoidY }: TooltipPlacementInput): TooltipPlacement {
  const fitsRight = position + TOOLTIP_GAP + size.width <= frame.width - TOOLTIP_INSET;
  const left = fitsRight ? position + TOOLTIP_GAP : position - TOOLTIP_GAP - size.width;
  const shadesPoint = avoidY !== null && avoidY < TOOLTIP_INSET + size.height + TOOLTIP_GAP;
  const top = shadesPoint ? frame.height - size.height - TOOLTIP_INSET : TOOLTIP_INSET;
  return { left: Math.max(left, TOOLTIP_INSET), top: Math.max(top, TOOLTIP_INSET) };
}
