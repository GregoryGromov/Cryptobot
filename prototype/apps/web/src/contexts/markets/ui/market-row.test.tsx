import type { MarketList } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { marketRow } from '~/contexts/markets/domain/market-list-vm';
import { MarketRowView } from './market-row';

type Market = MarketList[number]['markets'][number];

const bitcoin = (overrides: Partial<Market> = {}): Market => ({
  coin: 'BTC',
  key: 'BTC',
  name: 'Bitcoin',
  ticker: 'BTC',
  cls: 'majors',
  price: 62_000,
  change1h: 0.52,
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
  spark: [1, 2, 3],
  watched: false,
  opinion: { forecast: null, trade: null, busy: false },
  ...overrides,
});

const renderRow = async (market: Market, fresh = false) => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <ul>
          <MarketRowView row={marketRow(market, fresh)} onFollow={() => {}} />
        </ul>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole('link', { name: 'Bitcoin' });
};

beforeEach(() => {
  vi.stubGlobal('fetch', () => new Promise<Response>(() => {}));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarketRowView', () => {
  it('shows the price and the change over the hour', async () => {
    await renderRow(bitcoin());
    expect(screen.getByText(/^62\s000\s\$$/)).toBeTruthy();
    expect(screen.getByText(/^\+0,52\s%$/)).toBeTruthy();
  });

  it('opens the market’s own page from its name', async () => {
    await renderRow(bitcoin());
    expect(screen.getByRole('link', { name: 'Bitcoin' }).getAttribute('href')).toBe('/markets?m=BTC');
  });

  it('says so when a market has no price yet', async () => {
    await renderRow(bitcoin({ price: null, change1h: null }));
    expect(screen.getByText('нет цены')).toBeTruthy();
  });

  it('marks a market whose signal is fresh', async () => {
    await renderRow(bitcoin(), true);
    expect(screen.getByText('свежий сигнал')).toBeTruthy();
  });

  it('leaves a market without a fresh signal unmarked', async () => {
    await renderRow(bitcoin());
    expect(screen.queryByText('свежий сигнал')).toBeNull();
  });

  it('shows a followed market with its star pressed', async () => {
    await renderRow(bitcoin({ watched: true }));
    const star = screen.getByRole('button', { name: 'Следить за Bitcoin' });
    expect(star.getAttribute('aria-pressed')).toBe('true');
  });
});
