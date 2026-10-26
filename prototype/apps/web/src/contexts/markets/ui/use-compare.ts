import type { MarketList } from '@reinforce/server/dto';
import * as z from 'zod/mini';
import { create } from 'zustand';
import { persistDevicePreferences } from '~/shared/store/device-preference';
import { defaultPeers, MOST_COMPARED, withPeer } from '../domain/market-moves';

type Compared = { readonly peers: readonly string[]; readonly on: boolean };

type CompareStore = {
  readonly markets: Readonly<Record<string, Compared>>;
  readonly actions: { readonly changed: (coin: string, compared: Compared) => void };
};

const PersistedCompare = z.strictObject({
  markets: z.record(z.string(), z.strictObject({ peers: z.array(z.string()), on: z.boolean() })),
});

const useCompareStore = create<CompareStore>()(
  persistDevicePreferences(
    (set) => ({
      markets: {},
      actions: {
        changed: (coin, compared) => set((state) => ({ markets: { ...state.markets, [coin]: compared } })),
      },
    }),
    {
      name: 'reinforce.market-compare',
      schema: PersistedCompare,
      partialize: (state) => ({
        markets: Object.fromEntries(
          Object.entries(state.markets).map(([coin, c]) => [coin, { peers: [...c.peers], on: c.on }]),
        ),
      }),
      merge: (persisted, current) => ({
        ...current,
        markets: Object.fromEntries(
          Object.entries(persisted.markets).map(([coin, c]) => [
            coin,
            { peers: c.peers.slice(0, MOST_COMPARED), on: c.on },
          ]),
        ),
      }),
    },
  ),
);

export type MarketCompare = Compared & {
  readonly add: (coin: string) => void;
  readonly remove: (coin: string) => void;
  readonly toggle: () => void;
};

/** The markets a market is compared with on its chart, and whether the chart shows them, kept on the device. */
export function useMarketCompare(coin: string, list: MarketList): MarketCompare {
  const kept = useCompareStore((state) => state.markets[coin]);
  const changed = useCompareStore((state) => state.actions.changed);
  const compared = kept ?? { peers: defaultPeers(list, coin), on: false };
  return {
    ...compared,
    add: (peer) => changed(coin, { peers: withPeer(compared.peers, peer, coin), on: true }),
    remove: (peer) => {
      const peers = compared.peers.filter((p) => p !== peer);
      changed(coin, { peers, on: compared.on && peers.length > 0 });
    },
    toggle: () => changed(coin, { ...compared, on: !compared.on && compared.peers.length > 0 }),
  };
}
