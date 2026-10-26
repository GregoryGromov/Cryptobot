import type { MarketList } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { MarketPickerHost, type PickedMarket, useMarketPicker } from './market-picker';
import { useMarketPickerStore } from './market-picker-store';

const opinion = { forecast: null, trade: null, busy: false };
const day = {
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
};

const catalog: MarketList = [
  {
    cls: 'majors',
    title: 'Крупные',
    watched: true,
    markets: [
      {
        key: 'BTC',
        coin: 'BTC',
        name: 'Bitcoin',
        ticker: 'BTC',
        cls: 'majors',
        price: 60_000,
        change1h: 0.4,
        spark: [],
        watched: true,
        opinion,
        ...day,
      },
      {
        key: 'ETH',
        coin: 'ETH',
        name: 'Ethereum',
        ticker: 'ETH',
        cls: 'majors',
        price: 3_000,
        change1h: -0.3,
        spark: [],
        watched: false,
        opinion,
        ...day,
      },
    ],
  },
  {
    cls: 'commodities',
    title: 'Сырьё',
    watched: false,
    markets: [
      {
        key: 'GOLD',
        coin: 'xyz:GOLD',
        name: 'Золото',
        ticker: 'GOLD',
        cls: 'commodities',
        price: 2_400,
        change1h: null,
        spark: [],
        watched: false,
        opinion,
        ...day,
      },
    ],
  },
];

function Opener({ picks }: { readonly picks: PickedMarket[] }) {
  const pick = useMarketPicker();
  return (
    <button type="button" onClick={() => pick({ title: 'Рынок для разбора', onPick: (m) => picks.push(m) })}>
      open
    </button>
  );
}

const renderPicker = (picks: PickedMarket[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
  });
  client.setQueryData(trpc.views.catalog.queryKey(), catalog);
  render(
    <QueryClientProvider client={client}>
      <Opener picks={picks} />
      <MarketPickerHost />
    </QueryClientProvider>,
  );
};

const optionNames = () => screen.getAllByRole('option').map((option) => option.textContent);

beforeEach(() => {
  useMarketPickerStore.setState({ open: false, request: null });
});

describe('the market picker', () => {
  it('opens with the title it was asked with', async () => {
    const user = userEvent.setup();
    renderPicker([]);
    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(await screen.findByRole('dialog', { name: 'Рынок для разбора' })).toBeTruthy();
  });

  it('narrows the markets to what is typed', async () => {
    const user = userEvent.setup();
    renderPicker([]);
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.type(await screen.findByRole('combobox'), 'eth');
    expect(optionNames()).toEqual([expect.stringContaining('Ethereum')]);
  });

  it('narrows the markets to one class', async () => {
    const user = userEvent.setup();
    renderPicker([]);
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(await screen.findByRole('radio', { name: 'Сырьё' }));
    expect(optionNames()).toEqual([expect.stringContaining('Золото')]);
  });

  it('picks the first market on Enter and closes', async () => {
    const user = userEvent.setup();
    const picks: PickedMarket[] = [];
    renderPicker(picks);
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.type(await screen.findByRole('combobox'), 'gold{Enter}');
    expect(picks).toEqual([
      { coin: 'xyz:GOLD', name: 'Золото', ticker: 'GOLD', cls: 'commodities', key: 'GOLD' },
    ]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
