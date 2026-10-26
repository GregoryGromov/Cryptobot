import type { Session } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { ModePicker } from './mode-picker';
import { SettingsPage } from './settings-page';

const session: Session = {
  environment: 'replay',
  locale: 'ru',
  user: { name: 'Анна', guest: false },
  auth: { xaiAvailable: true, ownModelAvailable: false },
  model: true,
  ai: { own: false, route: 'free', free: { left: 10, limit: 10, resetAt: 0 } },
  agent: { id: '6f1c2b8e-7a3d-4e59-9b21-0c4d5e6f7a8b' },
  balance: { nav: 10_000, returnPct: 0 },
  connection: { provider: 'scripted', model: 'replay' },
  version: null,
  preferences: {
    classes: [],
    markets: ['BTC'],
    maxTradeUsd: 1000,
    analysisLimit: 10,
    ideaLimit: 10,
    mode: 'daytrader',
    autoAnalysis: false,
    alerts: true,
    actionableOnly: true,
    quiet: { on: false, from: 23, to: 7, tz: 'Europe/Moscow' },
    style: '',
  },
  telegram: { linked: false, username: null, bot: 'reinforce_bot', available: true },
  market: { phase: 'ready', lastBarEnd: 0, message: null, loaded: 1, total: 1, instruments: [] },
  classes: [],
  rules: {
    detector: { profile: 'upstream', version: 'v1', robustZ: null },
    tauPct: { 5: 0.1, 15: 0.2, 30: 0.3, 60: 0.4 },
    execution: {
      version: 'v1',
      feeRate: 0.00045,
      slippageBps: { high: 1, medium: 2, lower: 5 },
      funding: 'DISABLED',
      startNav: 10_000,
    },
    t0OffsetSeconds: 60,
    customRuntime: null,
  },
};

const pending: ((error: Error) => void)[] = [];

const failRequests = () => {
  for (const reject of pending.splice(0)) reject(new TypeError('Failed to fetch'));
};

const renderSettings = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  client.setQueryData(trpc.views.session.queryKey(), session);
  const router = createRouter({
    routeTree: createRootRoute({ component: SettingsPage }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    () =>
      new Promise<Response>((_, reject) => {
        pending.push(reject);
      }),
  );
});

afterEach(() => {
  failRequests();
  vi.unstubAllGlobals();
});

const renderPicker = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  client.setQueryData(trpc.views.session.queryKey(), session);
  render(
    <QueryClientProvider client={client}>
      <ModePicker />
    </QueryClientProvider>,
  );
};

describe('ModePicker', () => {
  it('names the term the person trades and switches to the other at once', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: /Дейтрейдер\s*30 мин/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Скальпер/ }));

    expect(await screen.findByRole('button', { name: /Скальпер\s*5 мин/ })).toBeTruthy();
  });
});

describe('SettingsPage', () => {
  it('shows a switched setting at once and puts it back when the save fails', async () => {
    const user = userEvent.setup();
    renderSettings();
    const ideas = await screen.findByRole('switch', { name: 'Присылать идеи' });

    await user.click(ideas);
    await waitFor(() => expect(ideas.getAttribute('aria-checked')).toBe('false'));
    act(() => failRequests());

    await waitFor(() => expect(ideas.getAttribute('aria-checked')).toBe('true'));
  });

  it('switches how the person trades at once', async () => {
    const user = userEvent.setup();
    renderSettings();
    const scalper = await screen.findByRole('radio', { name: /Скальпер/ });

    await user.click(scalper);

    await waitFor(() => expect(scalper.getAttribute('aria-checked')).toBe('true'));
  });

  it('leads to the broker instructions from its settings', async () => {
    renderSettings();

    const change = await screen.findByRole('link', { name: 'Изменить' });
    expect(change.getAttribute('href')).toBe('/settings/instructions');
  });

  it('refuses a trade cap above the limit and says why', async () => {
    const user = userEvent.setup();
    renderSettings();
    const cap = await screen.findByRole('textbox', { name: 'Сделка не больше' });

    await user.clear(cap);
    await user.type(cap, '20 000');
    await user.tab();

    expect(cap.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/^Не больше/).textContent).toMatch(/^Не больше 10\s000\s\$\.$/);
  });
});
