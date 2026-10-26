import type { AgentView, Journal, Trades } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { book, closedTrade, cycle, openTrade, T0 } from '~/contexts/trading/testing/fixtures';
import { stubTrpc } from '~/contexts/trading/testing/trpc-fetch';
import { trpc } from '~/shared/api/trpc';
import { portfolioSearch } from '../domain/portfolio-search';
import { PortfolioPage } from './portfolio-page';

const pulse = {
  accountId: 'account',
  now: T0,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: T0, message: null, loaded: 1, total: 1 },
} as const;

const trades: Trades = {
  user: book({
    nav: 10_250.5,
    returnPct: 2.505,
    realized: 12.5,
    rows: [openTrade({ id: 'mine', unrealized: 3.25 })],
  }),
  agent: book({
    book: 'agent',
    nav: 9_990,
    returnPct: -0.1,
    realized: -10,
    closedCount: 1,
    rows: [closedTrade({ id: 'his', book: 'agent', coin: 'SILVER', name: 'Silver', pnl: -10 })],
  }),
};

type Forecasts = { readonly journal?: Journal; readonly agent?: AgentView };

const renderPage = (path = '/portfolio', data: Trades = trades, forecasts: Forecasts = {}) => {
  const journal = forecasts.journal ?? [];
  stubTrpc((route) => {
    if (route === 'views.pulse') return pulse;
    if (route === 'views.portfolio') return data;
    if (route === 'views.journal') return journal;
    if (route === 'views.broker') return forecasts.agent ?? null;
    if (route === 'views.tradeChart') return { trade: trades.user.rows[0], candles: [] };
    return null;
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.portfolio.queryKey(), data);
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  client.setQueryData(trpc.views.journal.queryKey(), journal);
  if (forecasts.agent) client.setQueryData(trpc.views.broker.queryKey(), forecasts.agent);
  const rootRoute = createRootRoute();
  const portfolioRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/portfolio',
    validateSearch: portfolioSearch,
    component: function Page() {
      return <PortfolioPage search={portfolioRoute.useSearch()} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([portfolioRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
};

const HOUR = 3_600_000;

const twoCycles = (prefix: string, endNav: number) => ({
  currentCycleId: `${prefix}-2`,
  cycles: [
    cycle({ id: `${prefix}-1`, number: 1, startedAt: T0 - 9 * HOUR, endedAt: T0 - 5 * HOUR, endNav }),
    cycle({ id: `${prefix}-2`, number: 2, startedAt: T0 - 5 * HOUR }),
  ],
});

const restarted: Trades = {
  user: { ...trades.user, ...twoCycles('u', 9_000), rows: [] },
  agent: { ...trades.agent, ...twoCycles('a', -500), rows: [] },
};

const finished: Trades = {
  ...trades,
  user: book({
    realized: -10,
    closedCount: 1,
    rows: [closedTrade({ id: 'done', coin: 'SILVER', name: 'Silver', pnl: -10 })],
  }),
};

const scored = (n: number, hits: number) =>
  ({ scorecard: { terms: [{ horizon: 30, n, hits }] } }) as unknown as AgentView;

const journal: Journal = [
  {
    id: 'f1',
    coin: 'BTC',
    cohort: 'official',
    stateId: 's1',
    receivedAt: T0,
    t0: T0,
    deadline: null,
    origin: 'event',
    refines: null,
    versionId: 'v1',
    versionN: 1,
    runtime: 'local',
    attestation: 'platform-verified',
    p0: 100,
    stateClose: 100,
    forecasts: [
      {
        horizon: 30,
        probs: { p_up: 0.7, p_flat: 0.2, p_down: 0.1 },
        expected: 0.1,
        q: { q10: -0.2, q50: 0.1, q90: 0.3 },
        checkAt: T0 + 30 * 60_000,
        reference: null,
        result: null,
      },
    ],
    plan: {
      action: 'LONG',
      selected_horizon_minutes: 30,
      position_size_pct_nav: 50,
      stop_loss_pct: 1,
      take_profit_pct: 2,
    },
    rationale: null,
    levels: {},
    threadId: null,
  },
];

const untraded: Trades = { ...trades, user: book() };

const tile = (name: RegExp) => screen.findByRole('link', { name });
const facts = (name: string) => screen.findByRole('region', { name });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PortfolioPage', () => {
  it('sets the person’s one account as a tile with the return the server gives', async () => {
    renderPage();

    expect(within(await tile(/Мои сделки/)).getByText('+2,51 %')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Брокер/ })).toBeNull();
  });

  it('opens on the user’s own book', async () => {
    renderPage();

    expect(within(await facts('Мои сделки')).getByText('+12,50 $')).toBeTruthy();
    expect((await tile(/Мои сделки/)).getAttribute('aria-current')).toBe('page');
  });

  it('keeps to the person’s account when the address names the broker’s', async () => {
    renderPage('/portfolio?book=agent');

    expect(within(await facts('Мои сделки')).getByText('+12,50 $')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Брокер' })).toBeNull();
  });

  it('lists the open trades of the book under positions', async () => {
    renderPage();

    const positions = await screen.findByRole('tabpanel', { name: 'Позиции (1)' });
    expect(within(positions).getByRole('link', { name: /Gold лонг/ })).toBeTruthy();
  });

  it('puts the result of a trade next to its share of the amount', async () => {
    renderPage();

    const row = await screen.findByRole('link', { name: /Gold лонг/ });
    expect(within(row).getByText('+3,25 $ (+0,65 %)')).toBeTruthy();
  });

  it('tells how long is left until an open trade closes by itself', async () => {
    renderPage();

    const row = await screen.findByRole('link', { name: /Gold лонг/ });
    expect(within(row).getAllByText(/через 15\sмин/).length).toBeGreaterThan(0);
  });

  it('opens the history first when the book has only finished trades', async () => {
    renderPage('/portfolio', finished);

    const history = await screen.findByRole('tabpanel', { name: 'История (1)' });
    expect(within(history).getByRole('link', { name: /Silver лонг/ })).toBeTruthy();
    expect(within(history).getByText('\u221210,00 $ (\u22122,00 %)')).toBeTruthy();
  });

  it('says there are no open trades when the positions of such a book are asked for', async () => {
    const user = userEvent.setup();
    renderPage('/portfolio', finished);

    await user.click(await screen.findByRole('tab', { name: 'Позиции (0)' }));

    expect(await screen.findByText(/Открытых сделок нет/)).toBeTruthy();
  });

  it('tells how the forecasts come true under the account', async () => {
    renderPage('/portfolio', trades, { agent: scored(38, 23) });

    expect(within(await tile(/Прогнозы сбываются/)).getByText('6 из 10')).toBeTruthy();
  });

  it('holds the score back until ten forecasts are checked', async () => {
    renderPage('/portfolio', trades, { agent: scored(1, 1) });

    expect(
      within(await tile(/Прогнозы сбываются/)).getByText('оценка после 10 проверок · пока 1'),
    ).toBeTruthy();
  });

  it('lists the forecasts under a third tab', async () => {
    renderPage('/portfolio?tab=forecasts', trades, { journal });

    const forecasts = await screen.findByRole('tabpanel', { name: 'Прогнозы (1)' });
    expect(within(forecasts).getByText('BTC')).toBeTruthy();
  });

  it('opens the forecasts first when nothing has been traded yet', async () => {
    renderPage('/portfolio', untraded, { journal });

    expect(await screen.findByRole('tabpanel', { name: 'Прогнозы (1)' })).toBeTruthy();
  });

  it('opens a past cycle of the account while the tile keeps the current value', async () => {
    renderPage('/portfolio?userCycle=u-1', restarted);

    expect(within(await facts('Мои сделки')).getByText('\u221210,00 %')).toBeTruthy();
    expect(within(await tile(/Мои сделки/)).getByText('+2,51 %')).toBeTruthy();
    expect(screen.getAllByText(/закончился обнулением/)).toHaveLength(1);
  });

  it('opens a trade from the list in a sheet named after it', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    await user.click(await screen.findByRole('link', { name: /Gold лонг/ }));

    expect(router.state.location.search).toMatchObject({ trade: 'mine' });
    expect(await screen.findByRole('dialog', { name: 'Лонг · Gold' })).toBeTruthy();
  });
});
