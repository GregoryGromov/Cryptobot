import { type $ZodType, type output, safeParse } from 'zod/v4/core';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type DevicePreferenceInput<State, Schema extends $ZodType> = {
  readonly name: string;
  readonly schema: Schema;
  readonly partialize: (state: State) => output<Schema>;
  readonly merge: (persisted: output<Schema>, current: State) => State;
};

export const persistDevicePreferences = <State, Schema extends $ZodType>(
  initialize: StateCreator<State, [], []>,
  input: DevicePreferenceInput<State, Schema>,
) =>
  persist<State, [], [], output<Schema>>(initialize, {
    name: input.name,
    storage: createJSONStorage(() => window.localStorage),
    partialize: input.partialize,
    merge: (persisted, current) => {
      const parsed = safeParse(input.schema, persisted);
      return parsed.success ? input.merge(parsed.data, current) : current;
    },
  });
