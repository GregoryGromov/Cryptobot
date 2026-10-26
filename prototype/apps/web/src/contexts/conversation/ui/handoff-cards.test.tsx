import type { MarketList } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { btc } from '../domain/fixtures.test-util';
import { HandoffCards } from './handoff-cards';

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
        ...btc,
        key: 'BTC',
        watched: true,
        spark: [],
        opinion: { forecast: null, trade: null, busy: false },
        ...day,
      },
    ],
  },
];

const renderCards = async (markets: readonly string[]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  queryClient.setQueryData(trpc.views.catalog.queryKey(), catalog);
  const rootRoute = createRootRoute({
    component: () => <HandoffCards handoff={{ markets: [...markets], question: 'Что с биткоином?' }} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await router.load();
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HandoffCards', () => {
  it('offers the market the answer is about, to analyse or to open its conversation', async () => {
    await renderCards(['BTC']);

    expect(await screen.findByRole('button', { name: 'Разобрать' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Открыть разговор Bitcoin' }).getAttribute('href')).toBe(
      '/m/BTC',
    );
  });

  it('leaves out a market the catalogue does not know', async () => {
    await renderCards(['NOPE']);

    expect(screen.queryByRole('list')).toBeNull();
  });
});
