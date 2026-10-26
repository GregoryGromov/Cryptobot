import type { MarketList } from '@reinforce/server/dto';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { hourStories } from '~/contexts/markets/domain/hour-stories';
import { HourStories } from './hour-stories';

type Market = MarketList[number]['markets'][number];

const market = (coin: string, name: string): Market => ({
  coin,
  key: coin,
  name,
  ticker: coin,
  cls: 'alts',
  price: 100,
  change1h: 0.5,
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
  spark: [1, 2, 3],
  watched: false,
  opinion: { forecast: null, trade: null, busy: false },
});

const renderStories = async (markets: Market[]) => {
  const list: MarketList = [{ cls: 'alts', title: 'Альткоины', watched: false, markets }];
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <HourStories stories={hourStories(list)} /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  return screen.findByRole('region', { name: 'Сюжеты часа' });
};

describe('HourStories', () => {
  it('says the stories are a mock', async () => {
    const block = await renderStories([]);
    expect(within(block).getByText('МОК')).toBeTruthy();
    expect(within(block).getByText('пример, цифры не настоящие')).toBeTruthy();
  });

  it('tells each story with its title and its markets over the hour', async () => {
    const block = await renderStories([market('PUMP', 'Pump')]);
    expect(within(block).getByRole('heading', { name: 'Альткоины слабее биткоина' })).toBeTruthy();
    expect(
      within(block)
        .getByRole('link', { name: /^Pump\s*−1,71\s%$/ })
        .getAttribute('href'),
    ).toBe('/m/PUMP');
  });

  it('offers to discuss a story in the conversation of its first listed market', async () => {
    const block = await renderStories([market('ENA', 'Ethena')]);
    const links = within(block).getAllByRole('link', { name: 'Разобрать с брокером' });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/m/ENA']);
  });
});
