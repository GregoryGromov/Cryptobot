import type { Session } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { CLOSED } from '../domain/sign-in-flow';
import { ModelPicker } from './model-picker';
import { useSignInStore } from './sign-in-store';

const session = (ai: Session['ai'], ownModelAvailable: boolean): Session => ({
  environment: 'live',
  locale: 'ru',
  user: { name: 'Анна', guest: false },
  auth: { xaiAvailable: true, ownModelAvailable },
  model: true,
  ai,
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

const free = { left: 31, limit: 40, resetAt: new Date(2026, 9, 10, 3, 0).getTime() };

const renderPicker = (ai: Session['ai'], ownModelAvailable: boolean) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
  });
  client.setQueryData(trpc.views.session.queryKey(), session(ai, ownModelAvailable));
  render(
    <QueryClientProvider client={client}>
      <ModelPicker />
    </QueryClientProvider>,
  );
};

const openPicker = async (ai: Session['ai'], ownModelAvailable: boolean) => {
  renderPicker(ai, ownModelAvailable);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button'));
  return user;
};

const rows = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

beforeEach(() => {
  useSignInStore.setState({ flow: CLOSED });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

describe('the choice of whose Grok answers', () => {
  it("is named after the platform's Grok until the user's own answers", () => {
    renderPicker({ own: false, route: 'free', free }, true);

    expect(screen.getByRole('button', { name: 'Grok' })).toBeTruthy();
  });

  it("is named after the user's Grok when it answers", () => {
    renderPicker({ own: true, route: 'own', free }, true);

    expect(screen.getByRole('button', { name: 'Мой Grok' })).toBeTruthy();
  });

  it("says how much of the day's free answers is left", async () => {
    await openPicker({ own: false, route: 'free', free }, true);

    expect(rows()[0]).toBe('Grok от ReinforceбесплатноОсталось 31 из 40 на сегодня.');
  });

  it('says when the free answers come back once they are used up', async () => {
    await openPicker({ own: false, route: 'free', free: { ...free, left: 0 } }, true);

    expect(rows()[0]).toBe('Grok от ReinforceбесплатноНа сегодня закончились, вернутся в 03:00.');
  });

  it('offers to connect an own Grok where the deployment allows it, and opens the sign-in', async () => {
    const user = await openPicker({ own: false, route: 'free', free }, true);

    expect(rows()[1]).toBe('Мой GrokподключитьВойдите через xAI — ответы пойдут из вашей подписки.');
    await user.click(screen.getByRole('menuitem', { name: /Мой Grok/ }));
    expect(useSignInStore.getState().flow).not.toEqual(CLOSED);
  });

  it('says an own Grok comes later where the deployment has it off', async () => {
    await openPicker({ own: false, route: 'free', free }, false);

    const mine = screen.getByRole('menuitem', { name: /Мой Grok/ });
    expect(mine.textContent).toBe('Мой GrokпозжеПодключение своего Grok здесь пока выключено.');
    expect(mine.getAttribute('aria-disabled')).toBe('true');
  });

  it('lets a connected Grok be chosen or disconnected', async () => {
    await openPicker({ own: true, route: 'free', free }, true);

    expect(rows()).toEqual([
      'Grok от ReinforceбесплатноОсталось 31 из 40 на сегодня.',
      'Мой GrokОтвечает ваш Grok, запросы идут из вашей подписки xAI.',
      'Отключить свой Grok',
    ]);
  });
});
