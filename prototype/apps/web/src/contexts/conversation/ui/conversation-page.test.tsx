import type { Chat, ForecastNote } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickSpan } from '~/contexts/markets/ui/use-chart-dock';
import { trpc } from '~/shared/api/trpc';
import { answer, btc, chatOf, forecastNote, message, NOON } from '../domain/fixtures.test-util';
import { ConversationPage } from './conversation-page';

vi.mock('~/contexts/forecast/ui/episode-card', () => ({
  forecastAnchorId: (forecastId: string) => `forecast-${forecastId}`,
  EpisodeCard: ({ forecast, open }: { readonly forecast: ForecastNote; readonly open: boolean }) => (
    <div data-testid={`episode-${forecast.id}`} data-open={String(open)} />
  ),
}));

const FIELD = 'Сообщение брокеру';

const unreachableAfter = (ms: number) => () =>
  new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new TypeError('Failed to fetch')), ms);
  });

const renderPage = async (chat: Chat, idea: string | null = null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(trpc.views.chat.queryKey({ topic: chat.key }), chat);
  const rootRoute = createRootRoute({ component: () => <ConversationPage topic={chat.key} idea={idea} /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return screen.findByRole('textbox', { name: FIELD });
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(unreachableAfter(30)));
});

afterEach(() => {
  vi.unstubAllGlobals();
  const { result } = renderHook(() => usePickSpan());
  act(() => result.current('BTC', null));
});

describe('ConversationPage', () => {
  it('shows what was said as the user’s message the moment it is sent', async () => {
    vi.stubGlobal('fetch', vi.fn(unreachableAfter(300)));
    const user = userEvent.setup();
    const field = await renderPage(chatOf({ items: [answer('m1', 'Здравствуйте')] }));
    await user.type(field, 'А нефть?{Enter}');
    expect(screen.getByText('А нефть?', { selector: 'p' }).isConnected).toBe(true);
    expect(field).toHaveProperty('value', '');
  });

  it('gives the words back to the field when the server does not take them', async () => {
    const user = userEvent.setup();
    const field = await renderPage(chatOf({ items: [answer('m1', 'Здравствуйте')] }));
    await user.type(field, 'А нефть?{Enter}');
    await waitFor(() => expect(field).toHaveProperty('value', 'А нефть?'));
    expect(screen.queryByText('А нефть?', { selector: 'p' })).toBeNull();
  });

  it('makes a new line on Shift+Enter instead of sending', async () => {
    const user = userEvent.setup();
    const field = await renderPage(chatOf({ items: [answer('m1', 'Здравствуйте')] }));
    await user.type(field, 'Раз{Shift>}{Enter}{/Shift}два');
    expect(field).toHaveProperty('value', 'Раз\nдва');
  });

  it('draws the line over what is new right before the first unread message', async () => {
    await renderPage(
      chatOf({
        items: [answer('m1', 'Первое'), answer('m2', 'Второе'), answer('m3', 'Третье')],
        firstUnread: 'm2',
        unread: 2,
      }),
    );
    const line = screen.getByText('Новые сообщения');
    expect({
      first: Boolean(
        line.compareDocumentPosition(screen.getByText('Первое')) & Node.DOCUMENT_POSITION_PRECEDING,
      ),
      second: Boolean(
        line.compareDocumentPosition(screen.getByText('Второе')) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    }).toEqual({ first: true, second: true });
  });

  it('turns the next questions to the stretch of the chart once one is picked', async () => {
    const { result } = renderHook(() => usePickSpan());
    act(() => result.current('BTC', { from: NOON - 3_600_000, to: NOON }));
    await renderPage(
      chatOf({
        key: 'BTC',
        title: null,
        market: btc,
        latestThread: 'thread-1',
        items: [message({ key: 'm1', text: 'Цена стоит.', followUps: ['Почему стоит?'] })],
      }),
    );
    expect({
      span: ['Что тут было?', 'Было ли так раньше?', 'Что дальше?'].map(
        (name) => screen.queryByRole('button', { name }) !== null,
      ),
      next: screen.queryByRole('button', { name: 'Почему стоит?' }),
    }).toEqual({ span: [true, true, true], next: null });
  });

  it('keeps every forecast folded, the one a link names too', async () => {
    await renderPage(
      chatOf({
        key: 'BTC',
        title: null,
        market: btc,
        latestThread: 'thread-2',
        items: [
          message({ key: 'f1', forecast: forecastNote('forecast-1', 'thread-1') }),
          message({ key: 'f2', forecast: forecastNote('forecast-2', 'thread-2') }),
        ],
      }),
      'thread-1',
    );
    expect([
      screen.getByTestId('episode-forecast-1').getAttribute('data-open'),
      screen.getByTestId('episode-forecast-2').getAttribute('data-open'),
    ]).toEqual(['false', 'false']);
  });
});
