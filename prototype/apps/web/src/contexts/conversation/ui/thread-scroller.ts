import {
  clampScroll,
  easeOut,
  followStep,
  GAP_PX,
  glideMs,
  isAtEnd,
  isAway,
  nextScrollMode,
  passedFloor,
  roomFor,
  type ScrollEvent,
  type ScrollMode,
  SPARE_PX,
} from '../domain/scroll-mode';

export type ThreadState = { readonly away: boolean; readonly fresh: number };

export type ThreadScroller = {
  readonly attach: (root: HTMLElement) => () => void;
  readonly open: (anchor: string | null) => void;
  readonly brace: () => void;
  readonly turn: () => void;
  readonly toEnd: () => void;
  readonly reveal: (id: string) => void;
  readonly hold: () => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly snapshot: () => ThreadState;
};

const HAND_MS = 300;
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

const stillMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight;
const gapToEnd = (): number => maxScroll() - window.scrollY;

const layoutTop = (element: HTMLElement): number => {
  let top = 0;
  for (let node: Element | null = element; node instanceof HTMLElement; node = node.offsetParent)
    top += node.offsetTop;
  return top;
};

export const createThreadScroller = (): ThreadScroller => {
  let root: HTMLElement | null = null;
  let mode: ScrollMode = 'end';
  let hand = 0;
  let frame = 0;
  let aim: number | null = null;
  let first: HTMLElement | null = null;
  let lent = 0;
  let state: ThreadState = { away: false, fresh: 0 };
  const listeners = new Set<() => void>();
  const met = new WeakSet<Element>();
  const eyed = new WeakSet<Element>();

  const step = (event: ScrollEvent) => {
    mode = nextScrollMode(mode, event);
  };
  const publish = (next: ThreadState) => {
    if (next.away === state.away && next.fresh === state.fresh) return;
    state = next;
    for (const listener of listeners) listener();
  };
  const all = (selector: string): HTMLElement[] => [...(root?.querySelectorAll<HTMLElement>(selector) ?? [])];
  const one = (selector: string): HTMLElement | null => root?.querySelector<HTMLElement>(selector) ?? null;
  const under = (element: HTMLElement): number =>
    layoutTop(element) - (one('[data-head-bar]')?.offsetHeight ?? 0) - GAP_PX;

  const to = (top: number, smooth: boolean) => {
    const target = clampScroll(top, maxScroll());
    if (smooth && aim !== null && Math.abs(aim - target) < 2) return;
    cancelAnimationFrame(frame);
    aim = null;
    if (!smooth || stillMotion() || Math.abs(target - window.scrollY) < 2) {
      window.scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    aim = target;
    let from: number | null = null;
    let start = 0;
    let length = 0;
    const glide = (now: number) => {
      if (from === null) {
        from = window.scrollY;
        start = now;
        length = glideMs(target - from);
      }
      const t = Math.min(1, (now - start) / length);
      window.scrollTo({ top: from + (target - from) * easeOut(t), behavior: 'instant' });
      if (t < 1) frame = requestAnimationFrame(glide);
      else aim = null;
    };
    frame = requestAnimationFrame(glide);
  };

  const meet = () => {
    for (const entry of all('[data-entry]')) met.add(entry);
    first = null;
    lent = 0;
  };
  const inView = (entry: HTMLElement): boolean =>
    entry.getBoundingClientRect().bottom >
    (one('[data-head-bar]')?.getBoundingClientRect().bottom ?? 0) + GAP_PX;
  const reading = (): HTMLElement | null => {
    if (first?.isConnected && inView(first)) return first;
    return all('[data-entry][data-fresh]').find((entry) => !met.has(entry) && inView(entry)) ?? null;
  };
  const arrived = (): HTMLElement | null => {
    if (first?.isConnected) return first;
    first = all('[data-entry][data-fresh]').find((entry) => !met.has(entry)) ?? null;
    return first;
  };
  const keepRoom = (): HTMLElement | null => {
    const column = one('[data-thread-column]');
    const said = all('[data-entry][data-who="user"]').at(-1) ?? null;
    if (!column || !said) return said;
    const room = roomFor({
      saidTop: under(said),
      viewport: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      column: column.offsetHeight,
    });
    if (room.need > 0 || column.style.minHeight) column.style.minHeight = `${room.height}px`;
    return said;
  };
  const shown = () => {
    const away = isAway(gapToEnd());
    const floor = one('[data-thread-floor]')?.getBoundingClientRect().top ?? window.innerHeight;
    let below = 0;
    for (const entry of all('[data-entry][data-fresh]')) {
      if (eyed.has(entry)) continue;
      if (passedFloor(entry.getBoundingClientRect().top, floor)) eyed.add(entry);
      else below += 1;
    }
    publish({ away, fresh: away ? below : 0 });
  };
  const grown = () => {
    const come = mode === 'end' ? arrived() : null;
    const top = window.scrollY;
    const next = followStep(mode, {
      top,
      max: maxScroll(),
      arrived: come ? under(come) : null,
      spare: SPARE_PX - lent,
    });
    if (next.kind === 'spare') lent += next.top - top;
    if (next.kind !== 'stay') to(next.top, next.kind === 'glide');
    shown();
  };
  const resized = () => {
    if (mode === 'turn') keepRoom();
    grown();
  };
  const byHand = () => {
    hand = performance.now();
    cancelAnimationFrame(frame);
    aim = null;
  };
  const keys = (event: KeyboardEvent) => {
    if (NAV_KEYS.has(event.key)) byHand();
  };
  const scrolled = () => {
    shown();
    if (performance.now() - hand > HAND_MS) return;
    const kept = reading();
    meet();
    first = kept;
    step({ type: 'moved', atEnd: isAtEnd(gapToEnd()) });
  };

  const settle = (anchor: string | null) => {
    const target = anchor ? document.getElementById(anchor) : null;
    if (target) {
      to(under(target), false);
      step({ type: 'opened', atEnd: isAtEnd(gapToEnd()) });
    } else {
      step({ type: 'opened', atEnd: true });
      to(maxScroll(), false);
    }
  };

  return {
    attach: (node) => {
      root = node;
      const follow = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(grown);
      follow?.observe(node);
      window.addEventListener('resize', resized);
      window.addEventListener('scroll', scrolled, { passive: true });
      window.addEventListener('wheel', byHand, { passive: true });
      window.addEventListener('touchstart', byHand, { passive: true });
      window.addEventListener('keydown', keys);
      return () => {
        cancelAnimationFrame(frame);
        follow?.disconnect();
        window.removeEventListener('resize', resized);
        window.removeEventListener('scroll', scrolled);
        window.removeEventListener('wheel', byHand);
        window.removeEventListener('touchstart', byHand);
        window.removeEventListener('keydown', keys);
        root = null;
      };
    },
    open: (anchor) => {
      const opened = performance.now();
      settle(anchor);
      requestAnimationFrame(() => {
        if (root && hand < opened) settle(anchor);
      });
    },
    brace: () => {
      const column = one('[data-thread-column]');
      if (column && column.offsetHeight > (Number.parseFloat(column.style.minHeight) || 0))
        column.style.minHeight = `${column.offsetHeight}px`;
    },
    turn: () => {
      step({ type: 'spoke' });
      meet();
      const said = keepRoom();
      if (said) to(under(said), true);
    },
    toEnd: () => {
      step({ type: 'jumped' });
      meet();
      to(maxScroll(), true);
    },
    reveal: (id) => {
      const target = document.getElementById(id);
      if (!target) return;
      step({ type: 'revealed' });
      to(under(target), true);
    },
    hold: () => step({ type: 'held' }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => state,
  };
};
