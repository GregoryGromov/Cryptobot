import * as z from 'zod/mini';
import { create } from 'zustand';
import { useMediaQuery } from '~/shared/hooks/use-media-query';
import { persistDevicePreferences } from '~/shared/store/device-preference';
import type { Span, SpanGist } from '../domain/chart-vm';

const DOCK_QUERY = '(min-width: 80rem)';

export type ChartLook = 'candles' | 'line';

type ChartStore = {
  readonly docked: boolean;
  readonly sheet: boolean;
  readonly look: ChartLook;
  readonly spans: Readonly<Record<string, { readonly span: Span; readonly gist: SpanGist | null }>>;
  readonly actions: {
    readonly dockedChanged: (open: boolean) => void;
    readonly sheetChanged: (open: boolean) => void;
    readonly lookChanged: (look: ChartLook) => void;
    readonly picked: (topic: string, span: Span | null, gist?: SpanGist | null) => void;
  };
};

const PersistedChart = z.strictObject({
  docked: z.boolean(),
  look: z.optional(z.enum(['candles', 'line'])),
});

const useChartStore = create<ChartStore>()(
  persistDevicePreferences(
    (set) => ({
      docked: false,
      sheet: false,
      look: 'candles',
      spans: {},
      actions: {
        dockedChanged: (docked) => set({ docked }),
        sheetChanged: (sheet) => set({ sheet }),
        lookChanged: (look) => set({ look }),
        picked: (topic, span, gist = null) =>
          set((state) => {
            const { [topic]: _dropped, ...rest } = state.spans;
            return { spans: span ? { ...rest, [topic]: { span, gist } } : rest };
          }),
      },
    }),
    {
      name: 'reinforce.chart-dock',
      schema: PersistedChart,
      partialize: (state) => ({ docked: state.docked, look: state.look }),
      merge: (persisted, current) => ({
        ...current,
        docked: persisted.docked,
        look: persisted.look ?? current.look,
      }),
    },
  ),
);

export type ChartDockState = {
  readonly open: boolean;
  readonly docked: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly toggle: () => void;
};

/** Beside the conversation on a wide screen, where it stays open from market to market; a sheet elsewhere. */
export function useChartDock(): ChartDockState {
  const docked = useMediaQuery(DOCK_QUERY);
  const dockOpen = useChartStore((state) => state.docked);
  const sheetOpen = useChartStore((state) => state.sheet);
  const { dockedChanged, sheetChanged } = useChartStore((state) => state.actions);
  const open = docked ? dockOpen : sheetOpen;
  const setOpen = docked ? dockedChanged : sheetChanged;
  return { open, docked, setOpen, toggle: () => setOpen(!open) };
}

export const usePickedSpan = (topic: string): Span | null =>
  useChartStore((state) => state.spans[topic]?.span ?? null);

export const usePickedGist = (topic: string): SpanGist | null =>
  useChartStore((state) => state.spans[topic]?.gist ?? null);

/** Candles or a line of closes, the same on every chart of the device. */
export function useChartLook(): readonly [ChartLook, (look: ChartLook) => void] {
  const look = useChartStore((state) => state.look);
  const changed = useChartStore((state) => state.actions.lookChanged);
  return [look, changed];
}

export const usePickSpan = () => useChartStore((state) => state.actions.picked);
