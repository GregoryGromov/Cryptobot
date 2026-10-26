import { useLayoutEffect } from 'react';
import { waitLeft, waitTaken } from '~/shared/ui/wait-handoff';

const GROW_MS = 900;
const FOLD_MS = 550;
const SHOW_MS = 600;
const SHOW_AFTER_MS = 250;
const SHOW_STEP_MS = 90;
const FALLBACK_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Grows to the card's own height as it settles, which moves while its chart and log come in; a measure elsewhere.
const growsToAuto = (): boolean => CSS.supports('interpolate-size', 'allow-keywords');

const emphasized = (): string =>
  getComputedStyle(document.documentElement).getPropertyValue('--motion-ease-emphasized').trim() ||
  FALLBACK_EASE;

/**
 * A forecast card that takes the place of its analysis's wait grows out of it: the wait's steps fold away under the
 * head, the card opens down from the wait's height to its own, and what it shows comes in from the top.
 */
export function useGrowFromWait(article: HTMLElement | null, key: string): void {
  useLayoutEffect(() => {
    const wait = waitLeft(key);
    const head = article?.firstElementChild;
    if (!article || !wait || !head || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ease = emphasized();
    const full = growsToAuto() ? 'auto' : `${article.offsetHeight}px`;
    const gap = Number.parseFloat(getComputedStyle(article).rowGap) || 0;
    const shown = [...article.children].filter((child) => child !== head);
    const ghost = document.createElement('div');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    ghost.style.cssText = `overflow:hidden;flex-shrink:0;pointer-events:none;margin-bottom:${-gap}px`;
    const steps = wait.steps.cloneNode(true);
    ghost.append(steps);
    // The copy stands as the wait last showed it: its rows do not come in again, its shimmer stops.
    for (const part of ghost.querySelectorAll<HTMLElement>('*')) part.style.setProperty('animation', 'none');
    head.after(ghost);
    const folded = ghost.offsetHeight;
    article.style.setProperty('overflow', 'hidden');
    article.style.setProperty('interpolate-size', 'allow-keywords');
    const grow = article.animate([{ height: `${wait.height}px` }, { height: full }], {
      duration: GROW_MS,
      easing: ease,
    });
    const moves = [
      grow,
      ghost.animate(
        [
          { height: `${folded}px`, opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        { duration: FOLD_MS, easing: ease, fill: 'forwards' },
      ),
      ...shown.map((part, place) =>
        part.animate(
          [
            { opacity: 0, transform: 'translateY(-0.5rem)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: SHOW_MS, delay: SHOW_AFTER_MS + place * SHOW_STEP_MS, easing: ease, fill: 'backwards' },
        ),
      ),
    ];
    const settle = () => {
      ghost.remove();
      article.style.removeProperty('overflow');
      article.style.removeProperty('interpolate-size');
    };
    grow.finished.then(
      () => {
        settle();
        waitTaken(key);
      },
      () => undefined,
    );
    return () => {
      for (const move of moves) move.cancel();
      settle();
    };
  }, [article, key]);
}
