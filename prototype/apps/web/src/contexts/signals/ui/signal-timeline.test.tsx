import type { SignalRow } from '@reinforce/server/dto';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SignalTimeline } from './signal-timeline';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 9, 12, 0);

const row = (eventId: string, name: string, over: Partial<SignalRow> = {}): SignalRow => ({
  eventId,
  eventAt: NOW - 41 * MINUTE,
  staleAt: NOW - 26 * MINUTE,
  move: -1.75,
  horizon: 5,
  direction: 'DOWN',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: true,
  times: 26,
  spark: null,
  coin: eventId,
  name,
  ticker: eventId,
  cls: 'majors',
  price: 1,
  change1h: -2,
  chat: eventId,
  since: 0.6,
  asked: false,
  threadId: null,
  ...over,
});

const four = [
  row('OIL', 'Нефть'),
  row('GOLD', 'Золото', { eventAt: NOW - 73 * MINUTE }),
  row('BTC', 'Биткоин', { eventAt: NOW - 90 * MINUTE }),
  row('ETH', 'Эфир', { eventAt: NOW - 137 * MINUTE }),
];

const renderTimeline = async (
  items: readonly SignalRow[],
  onOpen: (signal: SignalRow) => void = () => {},
) => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <SignalTimeline items={items} now={NOW} onOpen={onOpen} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole('list', { name: 'Сигналы за сутки' });
};

describe('SignalTimeline', () => {
  it('opens the signal that was clicked', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    await renderTimeline(four, (signal) => opened.push(signal.eventId));

    await user.click(screen.getByRole('button', { name: /Золото/ }));

    expect(opened).toEqual(['GOLD']);
  });

  it('keeps the three latest signals to tap and leaves an older one as a link to its topic', async () => {
    await renderTimeline(four);

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^Нефть/),
      expect.stringMatching(/^Золото/),
      expect.stringMatching(/^Биткоин/),
    ]);
    expect(screen.getByRole('link', { name: 'Эфир' }).getAttribute('href')).toBe('/m/ETH');
  });

  it('says when it was, what moved, why it is a signal and what the price did after it', async () => {
    await renderTimeline([row('OIL', 'Нефть', { scope: 'BROAD' })]);

    expect(screen.getByText('41 мин')).toBeTruthy();
    expect(screen.getByRole('button').textContent).toMatch(
      /^Нефть−1,8\s%\sза 5 минНеобычно сильное падение вместе с частью рынка · в 26 раз сильнее обычного, объём высокий · после сигнала \+0,60\s%$/,
    );
  });

  it('tells a wave by its strongest market and names the others under it', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    await renderTimeline(
      [
        row('OIL', 'Нефть', { scope: 'BROAD' }),
        row('BTC', 'Биткоин', { scope: 'BROAD', times: 8, move: -0.44, eventAt: NOW - 42 * MINUTE }),
      ],
      (signal) => opened.push(signal.eventId),
    );

    expect(screen.getByText('Тем же ходом — ещё 1 рынок')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Биткоин/ }));

    expect(opened).toEqual(['BTC']);
  });

  it('shows no more than the thirty latest signals', async () => {
    await renderTimeline(
      Array.from({ length: 31 }, (_, i) =>
        row(`M${i}`, `Рынок ${i}`, { eventAt: NOW - (i + 1) * 10 * MINUTE }),
      ),
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(screen.getByText('Рынок 29')).toBeTruthy();
    expect(screen.queryByText('Рынок 30')).toBeNull();
  });
});
