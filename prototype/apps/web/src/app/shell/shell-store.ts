import * as z from 'zod/mini';
import { create } from 'zustand';
import { persistDevicePreferences } from '~/shared/store/device-preference';

type ShellActions = {
  readonly railToggled: () => void;
  readonly tapeToggled: () => void;
  readonly navigationOpened: () => void;
  readonly navigationClosed: () => void;
  readonly navigationOpenChanged: (open: boolean) => void;
};

type ShellStore = {
  readonly railFolded: boolean;
  readonly tapeHidden: boolean;
  readonly navigationOpen: boolean;
  readonly actions: ShellActions;
};

const PersistedShell = z.strictObject({ railFolded: z.boolean(), tapeHidden: z.boolean() });

const SHELL_DEFAULTS = { railFolded: false, tapeHidden: false, navigationOpen: false } as const;

const useShellStore = create<ShellStore>()(
  persistDevicePreferences(
    (set) => ({
      ...SHELL_DEFAULTS,
      actions: {
        railToggled: () => set((state) => ({ railFolded: !state.railFolded })),
        tapeToggled: () => set((state) => ({ tapeHidden: !state.tapeHidden })),
        navigationOpened: () => set({ navigationOpen: true }),
        navigationClosed: () => set({ navigationOpen: false }),
        navigationOpenChanged: (navigationOpen) => set({ navigationOpen }),
      },
    }),
    {
      name: 'reinforce.shell',
      schema: PersistedShell,
      partialize: (state) => ({ railFolded: state.railFolded, tapeHidden: state.tapeHidden }),
      merge: (persisted, current) => ({
        ...current,
        railFolded: persisted.railFolded,
        tapeHidden: persisted.tapeHidden,
      }),
    },
  ),
);

export const useRailFolded = (): boolean => useShellStore((state) => state.railFolded);
export const useTapeHidden = (): boolean => useShellStore((state) => state.tapeHidden);
export const useNavigationOpen = (): boolean => useShellStore((state) => state.navigationOpen);
export const useShellActions = (): ShellActions => useShellStore((state) => state.actions);
