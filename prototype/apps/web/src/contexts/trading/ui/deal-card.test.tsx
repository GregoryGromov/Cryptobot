import type { ChatProposal } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { proposal, T0 } from '../testing/fixtures';
import { stubTrpc } from '../testing/trpc-fetch';
import { DealCard } from './deal-card';

const pulse = {
  accountId: 'account',
  now: T0,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: T0, message: null, loaded: 1, total: 1 },
} as const;

const openTrade = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Открыть лонг' }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Открыть лонг' }));
};

const renderCard = (respond: (path: string) => unknown, card: ChatProposal = proposal()) => {
  const calls = stubTrpc((path) => (path === 'views.pulse' ? pulse : respond(path)));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  render(
    <QueryClientProvider client={client}>
      <DealCard proposal={card} marketName="Золото" topic="xyz:GOLD" />
    </QueryClientProvider>,
  );
  return calls;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('DealCard', () => {
  it('shows the scale from the stop to the target with the money at each end', () => {
    renderCard(() => null);
    expect(
      screen.getByRole('img', { name: /^Стоп 1\s980,00\s\$, вход 2\s000,40\s\$, цель 2\s040,00\s\$/ }),
    ).toBeTruthy();
    expect(screen.getByText('при стопе \u22125,42 $')).toBeTruthy();
    expect(screen.getByText('при цели +9,37 $')).toBeTruthy();
  });

  it('shows why the server refused the confirmation, under the buttons', async () => {
    const user = userEvent.setup();
    renderCard((path) =>
      path === 'trading.confirm' ? { kind: 'rejected', reason: 'expired' } : { id: 'guest' },
    );

    await openTrade(user);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Предложение истекло. Обсудите новые условия.',
    );
  });

  it('sends the confirmation for the version on the card', async () => {
    const user = userEvent.setup();
    const calls = renderCard((path) =>
      path === 'trading.confirm' ? { kind: 'rejected', reason: 'expired' } : {},
    );

    await openTrade(user);
    await screen.findByRole('alert');

    expect(calls.find((call) => call.path === 'trading.confirm')?.input).toEqual({
      versionId: '0f8a3c1e-2b7d-4c55-9a61-3e2f1b0c9d84',
      decision: 'confirmed',
    });
  });

  it('asks before opening the trade, with the amount and the money at the stop and the target', async () => {
    const user = userEvent.setup();
    const calls = renderCard(() => ({}));

    await user.click(screen.getByRole('button', { name: 'Открыть лонг' }));
    const dialog = await screen.findByRole('dialog', { name: 'Открыть лонг Золото?' });

    expect(dialog.textContent).toMatch(/Сумма500,00\s\$При стопе\u22125,42\s\$При цели\+9,37\s\$/);
    expect(calls.some((call) => call.path === 'trading.confirm')).toBe(false);
  });

  it('opens nothing when the question is cancelled', async () => {
    const user = userEvent.setup();
    const calls = renderCard(() => ({}));

    await user.click(screen.getByRole('button', { name: 'Открыть лонг' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Отмена' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(calls.some((call) => call.path === 'trading.confirm')).toBe(false);
  });

  it('counts down the time left to decide', () => {
    renderCard(() => null);
    expect(screen.getByText('Действует ещё 4:00')).toBeTruthy();
  });

  it('offers to update the terms of the latest stale proposal', () => {
    renderCard(() => null, proposal({ status: 'expired', estimate: null }));

    expect(screen.getByText('Предложение устарело: цена уже другая, условия нужно обновить')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Обновить условия' })).toBeTruthy();
  });

  it('does not offer to update a stale proposal that is not the latest', () => {
    renderCard(() => null, proposal({ status: 'expired', latest: false, estimate: null }));

    expect(screen.getByText('Предложение истекло')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Обновить условия' })).toBeNull();
  });

  it('asks the broker to revise the stale version in the conversation', async () => {
    const user = userEvent.setup();
    const calls = renderCard(
      (path) => (path === 'conversation.send' ? { kind: 'rejected', reason: 'not-found' } : {}),
      proposal({ status: 'expired', estimate: null }),
    );

    await user.click(screen.getByRole('button', { name: 'Обновить условия' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Объект не найден.');
    expect(calls.find((call) => call.path === 'conversation.send')?.input).toMatchObject({
      topic: 'xyz:GOLD',
      text: 'Обнови условия сделки',
      reviseProposalVersionId: '0f8a3c1e-2b7d-4c55-9a61-3e2f1b0c9d84',
    });
  });

  it('keeps one request id when the update is retried', async () => {
    const user = userEvent.setup();
    const calls = renderCard(
      (path) => (path === 'conversation.send' ? { kind: 'rejected', reason: 'not-found' } : {}),
      proposal({ status: 'expired', estimate: null }),
    );
    const revise = screen.getByRole('button', { name: 'Обновить условия' });

    await user.click(revise);
    await screen.findByRole('alert');
    await user.click(revise);
    await waitFor(() => expect(calls.filter((call) => call.path === 'conversation.send')).toHaveLength(2));

    const [first, second] = calls.filter((call) => call.path === 'conversation.send');
    expect(first?.input).toEqual(second?.input);
  });
});
