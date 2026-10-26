import type { MarketName } from '@reinforce/server/dto';
import { create } from 'zustand';

export type PickedMarket = MarketName & { readonly key: string };

export type MarketPickRequest = {
  readonly title: string;
  readonly onPick: (market: PickedMarket) => void;
};

type MarketPickerActions = {
  readonly opened: (request: MarketPickRequest) => void;
  readonly closed: () => void;
};

type MarketPickerStore = {
  readonly open: boolean;
  readonly request: MarketPickRequest | null;
  readonly actions: MarketPickerActions;
};

export const useMarketPickerStore = create<MarketPickerStore>()((set) => ({
  open: false,
  request: null,
  actions: {
    opened: (request) => set({ open: true, request }),
    closed: () => set({ open: false }),
  },
}));

export const useMarketPickerOpen = (): boolean => useMarketPickerStore((state) => state.open);
export const useMarketPickRequest = (): MarketPickRequest | null =>
  useMarketPickerStore((state) => state.request);
export const useMarketPickerActions = (): MarketPickerActions =>
  useMarketPickerStore((state) => state.actions);
