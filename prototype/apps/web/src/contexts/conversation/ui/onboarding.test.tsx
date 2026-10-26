import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { OnboardingButton, OnboardingChat } from './onboarding';
import { useOnboardingOpen, useOnboardingStore } from './onboarding-store';

function Home() {
  return useOnboardingOpen() ? <OnboardingChat /> : <OnboardingButton />;
}

const renderHome = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  client.setQueryData(trpc.views.catalog.queryKey(), []);
  const root = document.createElement('div');
  root.id = 'root';
  const menu = document.createElement('nav');
  menu.innerHTML = '<button type="button">Портфель</button>';
  const page = document.createElement('main');
  root.append(menu, page);
  document.body.append(root);
  render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
    { container: page },
  );
  return { menu };
};

// The tour plays each beat over a few seconds; with motion reduced it stands whole at once.
const stillMotion = (query: string): MediaQueryList =>
  ({
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(stillMotion);
  useOnboardingStore.setState({ open: true, seen: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('root')?.remove();
});

describe('OnboardingChat', () => {
  it('opens on a device that has not seen it with the signal and the first question in the composer', () => {
    renderHome();
    expect(screen.getByRole('region', { name: 'Сигнал' })).toBeTruthy();
    expect(screen.getByText('Куда пойдёт цена?')).toBeTruthy();
  });

  it('sends the typed question on «Дальше» and shows the broker’s forecast', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByRole('heading', { name: 'Скорее вниз' })).toBeTruthy();
    expect(screen.getByText('Почему вниз?')).toBeTruthy();
  });

  it('takes the last exchange back on «Назад» and puts its question back in the composer', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('Цена ушла ниже дна за час')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.queryByText('Цена ушла ниже дна за час')).toBeNull();
    expect(screen.getAllByText('Почему вниз?')).toHaveLength(1);
  });

  it('holds the rest of the app still while it plays', () => {
    const { menu } = renderHome();
    expect(menu.inert).toBe(true);
  });

  it('ends on «Начать» after the trade closed at its target', async () => {
    const user = userEvent.setup();
    renderHome();
    for (const _ of [1, 2, 3, 4, 5]) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText(/^Закрыта по цели/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Как это работает' })).toBeTruthy());
  });

  it('lands on the home on «Пропустить», gives the app back and stays closed on the next visit', async () => {
    const user = userEvent.setup();
    const { menu } = renderHome();
    await user.click(screen.getByRole('button', { name: 'Пропустить' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Как это работает' })).toBeTruthy());
    expect(menu.inert).toBe(false);
    expect(window.localStorage.getItem('reinforce.onboarding')).toContain('"seen":true');
  });

  it('starts again from its first message on «?»', async () => {
    const user = userEvent.setup();
    useOnboardingStore.setState({ open: false, seen: true });
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Как это работает' }));
    expect(screen.getByRole('region', { name: 'Сигнал' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Назад' })).toBeNull();
  });
});
