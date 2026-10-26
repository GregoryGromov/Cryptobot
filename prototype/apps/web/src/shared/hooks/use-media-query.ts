import { useSyncExternalStore } from 'react';

export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (changed) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', changed);
      return () => list.removeEventListener('change', changed);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 48rem)');

export const usePrefersReducedMotion = (): boolean => useMediaQuery('(prefers-reduced-motion: reduce)');
