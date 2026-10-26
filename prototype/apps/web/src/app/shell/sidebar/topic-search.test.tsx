import type { Chats, SearchHit } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { TopicSearch } from './topic-search';

const NOW = Date.UTC(2026, 9, 9, 12, 0);
const MINUTE = 60_000;

const summary = (key: string, minutesAgo: number) => ({
  key,
  preview: null,
  at: NOW - minutesAgo * MINUTE,
  unread: 0,
  spoken: true,
});

const market = (coin: string, name: string, minutesAgo: number): Chats['markets'][number] => ({
  ...summary(coin, minutesAgo),
  coin,
  name,
  ticker: coin,
  cls: 'majors',
  price: 1,
  change1h: 0,
  watched: true,
  position: null,
});

const chats: Chats = {
  status: null,
  lastSignalAt: null,
  broker: summary('broker', 30),
  talks: [{ ...summary('talk-1', 5), title: 'Привет' }],
  markets: [market('BTC', 'Биткоин', 20), market('ETH', 'Эфир', 10)],
};

const renderSearch = async (found: Readonly<Record<string, SearchHit[]>> = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
  });
  client.setQueryData(trpc.views.chats.queryKey(), chats);
  for (const [query, hits] of Object.entries(found))
    client.setQueryData(trpc.views.search.queryKey({ query }), hits);
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <TopicSearch /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Поиск по темам' }));
  await screen.findByRole('dialog', { name: 'Поиск по темам' });
  return user;
};

const topicNames = () => screen.getAllByRole('link').map((link) => link.textContent);

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

describe('the topic search', () => {
  it('lists the topics, the latest first', async () => {
    await renderSearch();

    expect(topicNames()).toEqual(['Привет', 'Эфир', 'Биткоин', 'Общий разговор']);
  });

  it('narrows the topics to what is typed', async () => {
    const user = await renderSearch();

    await user.type(screen.getByRole('textbox', { name: 'Поиск по темам' }), 'бит');

    expect(topicNames()).toEqual(['Биткоин']);
  });

  it('finds a market by its ticker', async () => {
    const user = await renderSearch();

    await user.type(screen.getByRole('textbox', { name: 'Поиск по темам' }), 'eth');

    expect(topicNames()).toEqual(['Эфир']);
  });

  it('shows what was said with the words typed, under the topic it was said in', async () => {
    const user = await renderSearch({
      стоп: [
        {
          id: 'entry-1',
          topic: 'BTC',
          at: NOW - 3 * MINUTE,
          role: 'broker',
          text: 'Стоп ниже уровня 98.',
          start: 0,
          length: 4,
        },
      ],
    });

    await user.type(screen.getByRole('textbox', { name: 'Поиск по темам' }), 'стоп');

    const found = await screen.findByRole('region', { name: 'В переписке' });
    expect(found.textContent).toBe('В перепискеБиткоинСтоп ниже уровня 98.');
    expect(found.querySelector('mark')?.textContent).toBe('Стоп');
  });

  it('says so when neither a topic nor a message matches', async () => {
    const user = await renderSearch({ золото: [] });

    await user.type(screen.getByRole('textbox', { name: 'Поиск по темам' }), 'золото');

    expect(await screen.findByText('Ничего не нашлось')).toBeTruthy();
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('closes on Escape', async () => {
    const user = await renderSearch();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
