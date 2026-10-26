import { useState, useSyncExternalStore } from 'react';
import { createThreadScroller, type ThreadScroller, type ThreadState } from './thread-scroller';

export type ThreadScroll = ThreadState & {
  readonly root: (node: HTMLElement | null) => (() => void) | undefined;
  readonly scroller: ThreadScroller;
};

export function useThreadScroll(anchor: string | null): ThreadScroll {
  const [thread] = useState(() => {
    const scroller = createThreadScroller();
    const root = (node: HTMLElement | null) => {
      if (!node) return undefined;
      const detach = scroller.attach(node);
      scroller.open(anchor);
      return detach;
    };
    return { scroller, root };
  });
  const state = useSyncExternalStore(
    thread.scroller.subscribe,
    thread.scroller.snapshot,
    thread.scroller.snapshot,
  );
  return { ...state, root: thread.root, scroller: thread.scroller };
}
