import { useState } from 'react';
import * as z from 'zod/mini';
import { create } from 'zustand';
import { useMediaQuery } from '~/shared/hooks/use-media-query';
import { persistDevicePreferences } from '~/shared/store/device-preference';

const DOCK_QUERY = '(min-width: 64rem)';

type TicketDockStore = {
  readonly open: boolean;
  readonly actions: { readonly openChanged: (open: boolean) => void };
};

const PersistedDock = z.strictObject({ open: z.boolean() });

const useTicketDockStore = create<TicketDockStore>()(
  persistDevicePreferences(
    (set) => ({
      open: false,
      actions: { openChanged: (open) => set({ open }) },
    }),
    {
      name: 'reinforce.ticket-dock',
      schema: PersistedDock,
      partialize: (state) => ({ open: state.open }),
      merge: (persisted, current) => ({ ...current, open: persisted.open }),
    },
  ),
);

export type TradeTicketState = {
  readonly open: boolean;
  readonly docked: boolean;
  readonly toggle: () => void;
  readonly setOpen: (open: boolean) => void;
};

export function useTradeTicket(): TradeTicketState {
  const docked = useMediaQuery(DOCK_QUERY);
  const dockOpen = useTicketDockStore((state) => state.open);
  const { openChanged } = useTicketDockStore((state) => state.actions);
  const [sheetOpen, setSheetOpen] = useState(false);
  const open = docked ? dockOpen : sheetOpen;
  const setOpen = docked ? openChanged : setSheetOpen;
  return { open, docked, toggle: () => setOpen(!open), setOpen };
}
