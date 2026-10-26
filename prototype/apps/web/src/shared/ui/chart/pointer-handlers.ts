import type { PointerEvent as ReactPointerEvent } from 'react';

type ChartPointerHandler = (event: ReactPointerEvent<HTMLElement>) => void;

export type ChartPointerHandlers = {
  readonly onPointerDown?: ChartPointerHandler;
  readonly onPointerMove?: ChartPointerHandler;
  readonly onPointerUp?: ChartPointerHandler;
  readonly onPointerCancel?: ChartPointerHandler;
  readonly onPointerLeave?: ChartPointerHandler;
};

const POINTER_PROPS = [
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel',
  'onPointerLeave',
] as const;

export function mergePointerHandlers(...sets: readonly ChartPointerHandlers[]): ChartPointerHandlers {
  const merged: { -readonly [K in keyof ChartPointerHandlers]: ChartPointerHandler } = {};
  for (const prop of POINTER_PROPS) {
    const chain = sets.map((set) => set[prop]).filter((handler) => handler !== undefined);
    if (chain.length === 0) continue;
    merged[prop] = (event) => {
      for (const handler of chain) handler(event);
    };
  }
  return merged;
}
