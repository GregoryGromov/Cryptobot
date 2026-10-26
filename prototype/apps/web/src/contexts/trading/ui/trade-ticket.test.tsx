import type { Chat } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { marketChat, T0, ticket } from '../testing/fixtures';
import { stubTrpc } from '../testing/trpc-fetch';
import { TradeTicket } from './trade-ticket';

const pulse = {
  accountId: 'account',
  now: T0,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: T0, message: null, loaded: 1, total: 1 },
} as const;

function Harness({ chat, docked }: { readonly chat: Chat; readonly docked: boolean }) {
  const [open, setOpen] = useState(true);
  return <TradeTicket chat={chat} open={open} docked={docked} onOpenChange={setOpen} />;
}

const renderTicket = (
  chat: Chat,
  manual: () => unknown = () => ({ kind: 'rejected', reason: 'market-unavailable' }),
  docked = false,
) => {
  const calls = stubTrpc((path) => {
    if (path === 'views.pulse') return pulse;
    if (path === 'trading.manual') return manual();
    return {};
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Harness chat={chat} docked={docked} /> });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return calls;
};

afterEach(() => cleanup());

const amountField = () => screen.findByLabelText('Сумма, $');

describe('TradeTicket', () => {
  it('names the limits when the amount is over them', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat());
    const amount = await amountField();

    await user.clear(amount);
    await user.type(amount, '1 500');

    expect(screen.getByText('Сумма от 1,00 $ до 1 000,00 $')).toBeTruthy();
  });

  it('explains an amount it cannot read', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat());
    const amount = await amountField();

    await user.clear(amount);
    await user.type(amount, '12abc');

    expect(screen.getByText('Не похоже на сумму — например, 500 или 1 250,50')).toBeTruthy();
  });

  it('refuses fractions of a cent instead of cutting them', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat());
    const amount = await amountField();

    await user.clear(amount);
    await user.type(amount, '10,555');

    expect(screen.getByText('Не больше двух знаков после запятой')).toBeTruthy();
  });

  it('asks for a target beyond the slippage', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat({ ticket: ticket({ slippageBps: 20 }) }));
    const take = await screen.findByLabelText('Цель, %');

    await user.clear(take);
    await user.type(take, '0,2');

    expect(screen.getByText('Цель должна быть дальше проскальзывания: больше 0,2 %')).toBeTruthy();
  });

  it('explains why a busy account cannot open a trade', async () => {
    renderTicket(marketChat({ ticket: ticket({ blockedReason: 'account-busy' }) }));

    expect(
      await screen.findByText(
        'На счёте уже есть открытая или ожидающая сделка. Новую можно открыть, когда она закроется.',
      ),
    ).toBeTruthy();
  });

  it('shows why the server refused the trade', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat());

    await user.click(await screen.findByRole('button', { name: /Открыть лонг/ }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Свежие данные этого рынка пока недоступны. Повторите разбор после обновления данных.',
    );
  });

  it('keeps the request id when the same terms are sent again', async () => {
    const user = userEvent.setup();
    const calls = renderTicket(marketChat());
    const submit = await screen.findByRole('button', { name: /Открыть лонг/ });

    await user.click(submit);
    await screen.findByRole('alert');
    await user.click(submit);
    await waitFor(() => expect(calls.filter((call) => call.path === 'trading.manual')).toHaveLength(2));

    const [first, second] = calls.filter((call) => call.path === 'trading.manual');
    expect(first?.input).toEqual(second?.input);
  });

  it('closes once the trade is ordered', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat(), () => ({ kind: 'ordered', replayed: false, order: {} }));

    await user.click(await screen.findByRole('button', { name: /Открыть лонг/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('stands as a panel of the page, not a dialog over it, when docked', async () => {
    renderTicket(marketChat(), undefined, true);

    expect(await screen.findByRole('complementary', { name: 'Своя сделка · Gold' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Сумма, $')).toBeTruthy();
  });

  it('closes the docked panel by its cross', async () => {
    const user = userEvent.setup();
    renderTicket(marketChat(), undefined, true);
    await screen.findByRole('complementary');

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));

    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
