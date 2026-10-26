import {
  clampPlotX,
  isTap,
  nearestIndex,
  type PlotFrame,
  type PointerPoint,
} from '@reinforce/ui-primitives/charts';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { match } from 'ts-pattern';
import { useMediaQuery } from '~/shared/hooks/use-media-query';
import type { ChartPointerHandlers } from './pointer-handlers';

export type ChartCrosshairInput = {
  readonly positions: readonly number[];
  readonly frame: PlotFrame;
  readonly active: boolean;
};

type ChartKeyboardHandlers = {
  readonly onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  readonly onBlur: () => void;
};

export type ChartCrosshair = {
  readonly index: number | null;
  readonly handlers: ChartPointerHandlers;
  readonly keyboardHandlers: ChartKeyboardHandlers;
};

export type CrosshairState = { readonly active: boolean; readonly x: number | null };

export function settleCrosshair(state: CrosshairState, active: boolean): CrosshairState {
  if (state.active === active) return state;
  if (!active) return { active, x: null };
  return { active, x: state.x };
}

const localX = (event: ReactPointerEvent<HTMLElement>): number =>
  event.clientX - event.currentTarget.getBoundingClientRect().left;

const CROSSHAIR_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'] as const;

type CrosshairKey = (typeof CROSSHAIR_KEYS)[number];

const crosshairKey = (key: string): CrosshairKey | null =>
  CROSSHAIR_KEYS.find((candidate) => candidate === key) ?? null;

const steppedIndex = (key: CrosshairKey, current: number | null, count: number): number | null =>
  match(key)
    .with('Escape', () => null)
    .with('Home', () => 0)
    .with('End', () => count - 1)
    .with('ArrowLeft', () => Math.max((current ?? count) - 1, 0))
    .with('ArrowRight', () => Math.min((current ?? -1) + 1, count - 1))
    .exhaustive();

const crosshairIndex = (positions: readonly number[], frame: PlotFrame, x: number | null): number | null => {
  if (x === null || positions.length === 0) return null;
  return nearestIndex(positions, clampPlotX(frame, x));
};

export function useChartCrosshair({ positions, frame, active }: ChartCrosshairInput): ChartCrosshair {
  const finePointer = useMediaQuery('(pointer: fine)');
  const [state, setState] = useState<CrosshairState>({ active, x: null });
  const pending = useRef<number | null>(null);
  const frameHandle = useRef(0);
  const pressedAt = useRef<PointerPoint | null>(null);

  const settled = settleCrosshair(state, active);
  if (state !== settled) setState(settled);

  useEffect(
    () => () => {
      if (frameHandle.current !== 0) cancelAnimationFrame(frameHandle.current);
    },
    [],
  );

  const hoverHandlers: ChartPointerHandlers = {
    onPointerMove: (event) => {
      if (!active) return;
      pending.current = localX(event);
      if (frameHandle.current !== 0) return;
      frameHandle.current = requestAnimationFrame(() => {
        frameHandle.current = 0;
        const x = pending.current;
        pending.current = null;
        if (x === null) return;
        setState((prev) => (prev.active ? { ...prev, x } : prev));
      });
    },
    onPointerLeave: () => {
      pending.current = null;
      setState((prev) => ({ ...prev, x: null }));
    },
  };

  const tapHandlers: ChartPointerHandlers = {
    onPointerDown: (event) => {
      pressedAt.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event) => {
      const from = pressedAt.current;
      pressedAt.current = null;
      if (from === null || !isTap(from, { x: event.clientX, y: event.clientY })) return;
      const x = localX(event);
      setState((prev) => ({ ...prev, x }));
    },
    onPointerCancel: () => {
      pressedAt.current = null;
    },
  };

  const keyboardHandlers: ChartKeyboardHandlers = {
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      const key = crosshairKey(event.key);
      if (key === null || !active || positions.length === 0) return;
      event.preventDefault();
      const stepped = steppedIndex(key, crosshairIndex(positions, frame, settled.x), positions.length);
      const x = stepped === null ? null : (positions[stepped] ?? null);
      setState((prev) => ({ ...prev, x }));
    },
    onBlur: () => {
      pending.current = null;
      setState((prev) => ({ ...prev, x: null }));
    },
  };

  return {
    index: crosshairIndex(positions, frame, settled.x),
    handlers: finePointer ? hoverHandlers : tapHandlers,
    keyboardHandlers,
  };
}
