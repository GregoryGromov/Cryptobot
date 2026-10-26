import * as z from 'zod/mini';
import { create } from 'zustand';
import { persistDevicePreferences } from '~/shared/store/device-preference';
import { INDICATORS, type Indicator } from '../domain/indicators';

type IndicatorStore = {
  readonly shown: readonly Indicator[];
  readonly actions: { readonly toggled: (indicator: Indicator) => void };
};

const PersistedIndicators = z.strictObject({ shown: z.array(z.enum(INDICATORS)) });

const useIndicatorStore = create<IndicatorStore>()(
  persistDevicePreferences(
    (set) => ({
      shown: [],
      actions: {
        toggled: (indicator) =>
          set((state) => ({
            shown: state.shown.includes(indicator)
              ? state.shown.filter((i) => i !== indicator)
              : INDICATORS.filter((i) => i === indicator || state.shown.includes(i)),
          })),
      },
    }),
    {
      name: 'reinforce.chart-indicators',
      schema: PersistedIndicators,
      partialize: (state) => ({ shown: [...state.shown] }),
      merge: (persisted, current) => ({ ...current, shown: persisted.shown }),
    },
  ),
);

/** The indicators a market's chart draws, the same on every market of the device. */
export function useIndicators(): readonly [readonly Indicator[], (indicator: Indicator) => void] {
  const shown = useIndicatorStore((state) => state.shown);
  const toggled = useIndicatorStore((state) => state.actions.toggled);
  return [shown, toggled];
}
