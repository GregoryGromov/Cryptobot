import { type RefObject, useLayoutEffect } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const FLIGHT = { duration: 380, easing: EASE } as const;
const ARRIVAL = { duration: 280, easing: EASE } as const;
// A page that took longer than this to come has nothing left to continue from.
const FRESH_MS = 1_500;

type Boarding = {
  readonly at: number;
  readonly rects: ReadonlyMap<string, DOMRect>;
  readonly met: Set<string>;
};

const flyers = new Map<string, HTMLElement>();
let boarding: Boarding | null = null;

const still = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Called as the page is about to change: notes where every flying element stands on the page being left. */
export function board(): void {
  const rects = new Map<string, DOMRect>();
  for (const [name, element] of flyers) rects.set(name, element.getBoundingClientRect());
  boarding = { at: performance.now(), rects, met: new Set() };
}

// Only the first of a name to mount after a page change arrives: the loaded page replacing its skeleton is there.
const arriving = (name: string): DOMRect | true | null => {
  if (!boarding || performance.now() - boarding.at > FRESH_MS || boarding.met.has(name)) return null;
  boarding.met.add(name);
  return boarding.rects.get(name) ?? true;
};

/**
 * One element that both pages have, such as the composer: on the new page it starts where the old page had it and
 * moves to its place, so the person sees it travel rather than vanish and reappear.
 */
export function useFlight(ref: RefObject<HTMLElement | null>, name: string): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    flyers.set(name, element);
    const from = arriving(name);
    if (from instanceof DOMRect && !still() && typeof element.animate === 'function') {
      const to = element.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1)
        element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], FLIGHT);
    }
    return () => {
      if (flyers.get(name) === element) flyers.delete(name);
    };
  }, [ref, name]);
}

/**
 * What a page change brings in fades up into place; the same element mounting again later stands still. `delay`
 * lets a flying element pass first.
 */
export function useArrival(ref: RefObject<HTMLElement | null>, name: string, delay = 0): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || arriving(name) === null || still() || typeof element.animate !== 'function') return;
    element.animate(
      [
        { opacity: 0, transform: 'translateY(0.375rem)' },
        { opacity: 1, transform: 'none' },
      ],
      { ...ARRIVAL, delay, fill: 'backwards' },
    );
  }, [ref, name, delay]);
}
