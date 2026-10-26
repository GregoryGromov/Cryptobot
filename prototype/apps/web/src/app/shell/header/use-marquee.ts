import { type RefObject, useEffect } from 'react';

const HOVER = '(hover: hover)';

export const useMarquee = (
  run: RefObject<HTMLElement | null>,
  input: { readonly copies: number; readonly durationMs: number },
): void => {
  const { copies, durationMs } = input;
  useEffect(() => {
    const element = run.current;
    if (!element || copies < 2 || typeof element.animate !== 'function') return;
    const animation = element.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(${-100 / copies}%, 0, 0)` }],
      { duration: durationMs, iterations: Number.POSITIVE_INFINITY, easing: 'linear' },
    );
    animation.currentTime = Date.now() % durationMs;
    const viewport = element.parentElement ?? element;
    const hovers = window.matchMedia(HOVER).matches;
    let hovered = false;
    let focused = false;
    const settle = () => {
      if (hovered || focused) animation.pause();
      else animation.play();
    };
    const enter = () => {
      hovered = hovers;
      settle();
    };
    const leave = () => {
      hovered = false;
      settle();
    };
    const focusIn = () => {
      focused = true;
      settle();
    };
    const focusOut = () => {
      focused = false;
      settle();
    };
    viewport.addEventListener('pointerenter', enter);
    viewport.addEventListener('pointerleave', leave);
    viewport.addEventListener('focusin', focusIn);
    viewport.addEventListener('focusout', focusOut);
    return () => {
      viewport.removeEventListener('pointerenter', enter);
      viewport.removeEventListener('pointerleave', leave);
      viewport.removeEventListener('focusin', focusIn);
      viewport.removeEventListener('focusout', focusOut);
      animation.cancel();
    };
  }, [run, copies, durationMs]);
};
