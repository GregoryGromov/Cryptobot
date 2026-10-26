import type { Session } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { CLOSED } from '../domain/sign-in-flow';
import { AccountCorner } from './account-corner';
import { useSignInStore } from './sign-in-store';

const RESET_AT = new Date(2026, 9, 10, 3, 0).getTime();

const session = (user: Session['user'], free: Session['ai']['free']): Session => ({
  environment: 'live',
  locale: 'ru',
  user,
  auth: { xaiAvailable: true, ownModelAvailable: false },
  model: true,
  ai: { own: false, route: 'free', free },
  agent: { id: 'agent-1' },
  balance: { nav: 10_000, returnPct: 0 },
  connection: { provider: 'xai', model: 'grok' },
  version: null,
  preferences: {
    classes: [],
    markets: [],
    maxTradeUsd: 500,
    analysisLimit: 10,
    ideaLimit: 5,
    mode: 'daytrader',
    autoAnalysis: false,
    alerts: false,
    actionableOnly: false,
    quiet: { on: false, from: 0, to: 0, tz: 'UTC' },
    style: '',
  },
  telegram: { linked: false, username: null, bot: null, available: false },
  market: { phase: 'ready', lastBarEnd: null, message: null, loaded: 0, total: 0, instruments: [] },
  classes: [],
  rules: {
    detector: { profile: 'upstream', version: 'atp-signal', robustZ: null },
    tauPct: { 5: 0.1, 15: 0.2, 30: 0.3, 60: 0.4 },
    execution: {
      version: 'v1',
      feeRate: 0.00045,
      slippageBps: { high: 1, medium: 2, lower: 3 },
      funding: 'DISABLED',
      startNav: 10_000,
    },
    t0OffsetSeconds: 60,
    customRuntime: null,
  },
});

const renderCorner = (data: Session) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
  });
  client.setQueryData(trpc.views.session.queryKey(), data);
  const root = createRootRoute({
    component: () => (
      <>
        <AccountCorner />
        <Outlet />
      </>
    ),
  });
  const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ['/'] }) });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  useSignInStore.setState({ flow: CLOSED });
});

describe('the account corner', () => {
  it('shows how many Grok requests are left today in the account menu', async () => {
    const user = userEvent.setup();
    renderCorner(session({ name: 'Анна', guest: false }, { left: 18, limit: 40, resetAt: RESET_AT }));
    await user.click(await screen.findByRole('button', { name: /Анна/ }));
    expect(await screen.findByText('Сегодня осталось 18 из 40 запросов к Grok.')).toBeTruthy();
  });

  it('keeps the settings out of the account menu: they have their own row in the side menu', async () => {
    const user = userEvent.setup();
    renderCorner(session({ name: 'Анна', guest: false }, { left: 18, limit: 40, resetAt: RESET_AT }));
    await user.click(await screen.findByRole('button', { name: /Анна/ }));
    await screen.findByRole('menuitem', { name: 'Выйти' });
    expect(screen.queryByRole('menuitem', { name: 'Настройки' })).toBeNull();
  });

  it('says when used-up requests come back', async () => {
    const user = userEvent.setup();
    renderCorner(session({ name: 'Анна', guest: false }, { left: 0, limit: 40, resetAt: RESET_AT }));
    await user.click(await screen.findByRole('button', { name: /Анна/ }));
    expect(await screen.findByText('Обновятся в 03:00.')).toBeTruthy();
  });

  it('offers a guest to sign in instead', async () => {
    renderCorner(session({ name: '', guest: true }, { left: 12, limit: 12, resetAt: RESET_AT }));
    expect(await screen.findByRole('button', { name: 'Войти' })).toBeTruthy();
  });
});
