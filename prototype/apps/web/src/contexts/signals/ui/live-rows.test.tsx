import type { Pulse, SignalRow } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { LiveRows } from './live-rows';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 9, 12, 0);

const pulse: Pulse = {
  accountId: null,
  now: NOW,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: NOW, message: null, loaded: 1, total: 1 },
};

const row = (
  eventId: string,
  name: string,
  minutesAgo: number,
  over: Partial<SignalRow> = {},
): SignalRow => ({
  eventId,
  eventAt: NOW - minutesAgo * MINUTE,
  staleAt: NOW + 11 * MINUTE,
  move: -0.38,
  horizon: 5,
  direction: 'DOWN',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: true,
  times: 20,
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

const five = [
  row('XYZ100', 'XYZ100', 39),
  row('GOLD', 'Золото', 71),
  row('OIL', 'Нефть', 72),
  row('ETH', 'Эфир', 135),
  row('SOL', 'Солана', 200),
];

const renderRows = (items: readonly SignalRow[], onOpen: (signal: SignalRow) => void = () => {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  return render(
    <QueryClientProvider client={client}>
      <LiveRows items={items} onOpen={onOpen} quiet={<p>Сейчас тихо</p>} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

describe('LiveRows', () => {
  it('lists the three latest signals, the latest first', () => {
    renderRows(five);

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^XYZ100: падение на 0,38\s%/),
      expect.stringMatching(/^Золото: падение на 0,38\s%/),
      expect.stringMatching(/^Нефть: падение на 0,38\s%/),
    ]);
  });

  it('says a signal as a sentence: what moved, how far, over what time and how unusually', () => {
    renderRows([row('XYZ100', 'XYZ100', 39)]);

    expect(screen.getByRole('button').textContent).toMatch(
      /^XYZ100: падение на 0,38\s%\sза 5\sмин — в 20 раз сильнее обычного/,
    );
  });

  it('names the markets that moved with the signal', () => {
    const wave = ['BTC', 'NVDA', 'SOL', 'ETH'].map((coin, index) =>
      row(coin, coin, 39, { scope: 'MARKET_WIDE', times: 20 - index }),
    );
    renderRows(wave);

    expect(screen.getByRole('button').textContent).toContain('тем же ходом: NVDA, SOL и ещё 1');
  });

  it('opens the signal that was clicked', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    renderRows(five, (signal) => opened.push(signal.eventId));

    await user.click(screen.getByRole('button', { name: /Золото/ }));

    expect(opened).toEqual(['GOLD']);
  });

  it('says the quiet words when there is no signal', () => {
    renderRows([]);

    expect(screen.getByText('Сейчас тихо')).toBeTruthy();
  });
});
