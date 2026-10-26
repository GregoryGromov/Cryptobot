import { match } from 'ts-pattern';

export type ChartBoxSize = { readonly width: number; readonly height: number };

export type PlotFrame = {
  readonly width: number;
  readonly padLeft: number;
  readonly padRight: number;
};

export type PlotMode = 'point' | 'band';

export type PlotScale = {
  readonly step: number;
  readonly x: (index: number) => number;
};

export type AxisAnchor = 'start' | 'middle' | 'end';

export type PointerPoint = { readonly x: number; readonly y: number };

const TAP_THRESHOLD_PX = 8;

const ANCHOR_EDGE_PX = 4;
const NARROW_FRAME_PX = 480;
const NARROW_LABELS = 3;
const WIDE_LABELS = 5;

type PlotSpacing = { readonly divisor: number; readonly offset: number };

const plotSpacing = (mode: PlotMode, windowSize: number): PlotSpacing =>
  match(mode)
    .with('point', () => ({ divisor: Math.max(windowSize - 1, 1), offset: 0 }))
    .with('band', () => ({ divisor: Math.max(windowSize, 1), offset: 0.5 }))
    .exhaustive();

const plotSpan = (frame: PlotFrame): number => frame.width - frame.padLeft - frame.padRight;

export function plotStep(input: {
  readonly frame: PlotFrame;
  readonly windowSize: number;
  readonly mode: PlotMode;
}): number {
  return plotSpan(input.frame) / plotSpacing(input.mode, input.windowSize).divisor;
}

export function plotScale(input: {
  readonly frame: PlotFrame;
  readonly windowSize: number;
  readonly phase: number;
  readonly mode: PlotMode;
}): PlotScale {
  const { offset } = plotSpacing(input.mode, input.windowSize);
  const step = plotStep(input);
  return {
    step,
    x: (index) => input.frame.padLeft + (index + offset - input.phase) * step,
  };
}

export function clampPlotX(frame: PlotFrame, x: number): number {
  return Math.min(Math.max(x, frame.padLeft), frame.width - frame.padRight);
}

export function axisLabelAnchor(frame: PlotFrame, x: number): AxisAnchor {
  if (x <= frame.padLeft + ANCHOR_EDGE_PX) return 'start';
  if (x >= frame.width - frame.padRight - ANCHOR_EDGE_PX) return 'end';
  return 'middle';
}

export function axisLabelIndices(input: {
  readonly frame: PlotFrame;
  readonly visibleCount: number;
  readonly windowSize: number;
  readonly phase: number;
  readonly mode: PlotMode;
}): readonly number[] {
  if (input.visibleCount === 0) return [];
  const bounds = match(input.mode)
    .with('point', () => ({
      first: Math.ceil(input.phase),
      last: Math.floor(input.windowSize - 1 + input.phase),
    }))
    .with('band', () => ({
      first: Math.max(0, Math.ceil(input.phase - 0.5)),
      last: Math.floor(input.windowSize - 0.5 + input.phase),
    }))
    .exhaustive();
  const span = Math.max(Math.min(input.visibleCount - 1, bounds.last) - bounds.first, 0);
  const count = Math.min(input.frame.width < NARROW_FRAME_PX ? NARROW_LABELS : WIDE_LABELS, span + 1);
  if (count === 1) return [bounds.first];
  return Array.from({ length: count }, (_, step) => bounds.first + Math.round((step * span) / (count - 1)));
}

export function isTap(from: PointerPoint, to: PointerPoint, threshold = TAP_THRESHOLD_PX): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) < threshold;
}
