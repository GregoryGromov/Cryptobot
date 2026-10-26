import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, expect, it } from 'vitest';
import { mergePointerHandlers } from './pointer-handlers';

const event = { pointerId: 7 } as unknown as ReactPointerEvent<HTMLElement>;

describe('mergePointerHandlers', () => {
  it('drives every handler of a shared prop in argument order', () => {
    const seen: string[] = [];

    const merged = mergePointerHandlers(
      { onPointerDown: () => seen.push('pan') },
      { onPointerDown: () => seen.push('crosshair') },
    );
    merged.onPointerDown?.(event);

    expect(seen).toEqual(['pan', 'crosshair']);
  });

  it('hands the event to each handler', () => {
    const seen: ReactPointerEvent<HTMLElement>[] = [];

    const merged = mergePointerHandlers(
      { onPointerMove: (moved) => seen.push(moved) },
      { onPointerMove: (moved) => seen.push(moved) },
    );
    merged.onPointerMove?.(event);

    expect(seen).toEqual([event, event]);
  });

  it('leaves a prop nobody handles undefined', () => {
    const merged = mergePointerHandlers({ onPointerDown: () => {} }, { onPointerUp: () => {} });

    expect(merged.onPointerLeave).toBeUndefined();
    expect(merged.onPointerUp).toBeTypeOf('function');
  });
});
