import { type RefObject, useLayoutEffect, useRef } from 'react';

const MOVE = { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' } as const;

/**
 * Lets the `[data-flip]` children of a list glide to where a new order puts them instead of jumping there; a child
 * that was not there fades in. Positions are taken against the list, so scrolling it moves nothing.
 */
export function useFlip(list: RefObject<HTMLElement | null>): void {
  const before = useRef<Map<string, number> | null>(null);
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const origin = node.getBoundingClientRect().top;
    const now = new Map<string, number>();
    for (const child of node.querySelectorAll<HTMLElement>('[data-flip]')) {
      const key = child.dataset.flip ?? '';
      const top = child.getBoundingClientRect().top - origin;
      now.set(key, top);
      const was = before.current?.get(key);
      if (still || before.current === null || typeof child.animate !== 'function') continue;
      if (was === undefined) child.animate([{ opacity: 0 }, { opacity: 1 }], MOVE);
      else if (Math.abs(was - top) > 1)
        child.animate([{ transform: `translateY(${was - top}px)` }, { transform: 'none' }], MOVE);
    }
    before.current = now;
  });
}
