import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NavSections } from './nav-sections';

const renderNav = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <NavSections expanded /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

afterEach(cleanup);

describe('the sections of the side menu', () => {
  it('lists the settings as a section of their own and no section of the broker', async () => {
    renderNav();

    const nav = await screen.findByRole('navigation', { name: 'Разделы' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Сигналы', 'Рынки', 'Портфель', 'Лидерборд#37', 'Настройки']);
  });
});
