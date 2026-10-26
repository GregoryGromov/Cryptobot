import * as z from 'zod/mini';
import { create } from 'zustand';
import { persistDevicePreferences } from '~/shared/store/device-preference';

type OnboardingActions = {
  readonly opened: () => void;
  readonly closed: () => void;
};

type OnboardingStore = {
  readonly open: boolean;
  readonly seen: boolean;
  readonly actions: OnboardingActions;
};

const PersistedOnboarding = z.strictObject({ seen: z.boolean() });

// A device that has not closed the tour yet finds it open on the home screen; after that only «?» opens it.
export const useOnboardingStore = create<OnboardingStore>()(
  persistDevicePreferences(
    (set) => ({
      open: true,
      seen: false,
      actions: {
        opened: () => set({ open: true }),
        closed: () => set({ open: false, seen: true }),
      },
    }),
    {
      name: 'reinforce.onboarding',
      schema: PersistedOnboarding,
      partialize: (state) => ({ seen: state.seen }),
      merge: (persisted, current) => ({ ...current, seen: persisted.seen, open: !persisted.seen }),
    },
  ),
);

export const useOnboardingOpen = (): boolean => useOnboardingStore((state) => state.open);
export const useOnboardingActions = (): OnboardingActions => useOnboardingStore((state) => state.actions);
