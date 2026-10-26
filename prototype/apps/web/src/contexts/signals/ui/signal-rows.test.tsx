import type { Pulse, SignalRow } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { SignalRows } from './signal-rows';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 9, 12, 0);

const pulse: Pulse = {
  accountId: null,
  now: NOW,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: NOW, message: null, loaded: 1, total: 1 },
};

const row = (eventId: string, name: string, over: Partial<SignalRow> = {}): SignalRow => ({
  eventId,
  eventAt: NOW - 4 * MINUTE,
  staleAt: NOW + 11 * MINUTE,
  move: 2.4,
  horizon: 15,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: true,
  times: 3,
  spark: null,
  coin: eventId,
  name,
  ticker: eventId,
  cls: 'majors',
  price: 1,
  change1h: 2,
  chat: eventId,
  since: null,
  asked: false,
  threadId: null,
  ...over,
});

const items = [row('BTC', 'Биткоин'), row('ETH', 'Эфир', { eventAt: NOW - 9 * MINUTE })];

const renderRows = (onOpen: (signal: SignalRow) => void) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  return render(
    <QueryClientProvider client={client}>
      <SignalRows items={items} onOpen={onOpen} quiet={<p>quiet</p>} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

describe('SignalRows', () => {
  it('opens the signal that was clicked', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    renderRows((signal) => opened.push(signal.eventId));

    await user.click(screen.getByRole('button', { name: /Эфир/ }));

    expect(opened).toEqual(['ETH']);
  });

  it('opens the focused signal on Enter', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    renderRows((signal) => opened.push(signal.eventId));

    screen.getByRole('button', { name: /Биткоин/ }).focus();
    await user.keyboard('{Enter}');

    expect(opened).toEqual(['BTC']);
  });

  it('lists the latest signal first with its move and horizon', () => {
    renderRows(() => {});

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^Биткоин\+2,4\s%за 15 мин/),
      expect.stringMatching(/^Эфир\+2,4\s%за 15 мин/),
    ]);
  });

  it('says the quiet words when there is no signal', () => {
    const client = new QueryClient();
    client.setQueryData(trpc.views.pulse.queryKey(), pulse);
    render(
      <QueryClientProvider client={client}>
        <SignalRows items={[]} onOpen={() => {}} quiet={<p>Сейчас тихо</p>} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Сейчас тихо')).toBeTruthy();
  });
});
