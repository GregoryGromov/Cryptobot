import { useEffect, useSyncExternalStore } from 'react';
import { match } from 'ts-pattern';
import * as z from 'zod/mini';
import { create } from 'zustand';
import { persistDevicePreferences } from '~/shared/store/device-preference';
import { THEME_STORAGE_KEY } from './theme-key';

export type Theme = 'light' | 'dark' | 'system';

type ThemeActions = {
  readonly themeSelected: (theme: Theme) => void;
};

type ThemeStore = {
  readonly theme: Theme;
  readonly actions: ThemeActions;
};

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

const prefersDark = (): boolean => window.matchMedia(SYSTEM_DARK).matches;

const resolveTheme = (theme: Theme, systemDark: boolean): 'light' | 'dark' =>
  match(theme)
    .with('system', () => (systemDark ? 'dark' : 'light'))
    .with('light', 'dark', (t) => t)
    .exhaustive();

const applyDomClass = (theme: Theme): void => {
  document.documentElement.classList.toggle('dark', resolveTheme(theme, prefersDark()) === 'dark');
};

const PersistedTheme = z.strictObject({ theme: z.enum(['light', 'dark', 'system']) });

const useThemeStore = create<ThemeStore>()(
  persistDevicePreferences(
    (set) => ({
      theme: 'system',
      actions: {
        themeSelected: (theme) => {
          applyDomClass(theme);
          set({ theme });
        },
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      schema: PersistedTheme,
      partialize: (state) => ({ theme: state.theme }),
      merge: (persisted, current) => {
        applyDomClass(persisted.theme);
        return { ...current, theme: persisted.theme };
      },
    },
  ),
);

export const useTheme = (): Theme => useThemeStore((s) => s.theme);
export const useThemeActions = (): ThemeActions => useThemeStore((s) => s.actions);

const subscribeSystemDark = (changed: () => void): (() => void) => {
  const list = window.matchMedia(SYSTEM_DARK);
  list.addEventListener('change', changed);
  return () => list.removeEventListener('change', changed);
};

export const useResolvedTheme = (): 'light' | 'dark' => {
  const theme = useTheme();
  const systemDark = useSyncExternalStore(subscribeSystemDark, prefersDark, () => false);
  return resolveTheme(theme, systemDark);
};

export function ThemeEffects() {
  const theme = useTheme();
  const resolved = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);
  useEffect(() => {
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][data-theme]')) {
      meta.media =
        theme === 'system'
          ? `(prefers-color-scheme: ${meta.dataset.theme})`
          : theme === meta.dataset.theme
            ? 'all'
            : 'not all';
    }
  }, [theme]);
  return null;
}
