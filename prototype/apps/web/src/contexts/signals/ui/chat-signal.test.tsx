import type { Pulse, SignalView } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubTrpc } from '~/contexts/trading/testing/trpc-fetch';
import { trpc } from '~/shared/api/trpc';
import { ChatSignal } from './chat-signal';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 9, 12, 0);

const pulse: Pulse = {
  accountId: null,
  now: NOW,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: NOW, message: null, loaded: 1, total: 1 },
};

const signal = (over: Partial<SignalView> = {}): SignalView => ({
  eventId: 'event',
  eventAt: NOW - 4 * MINUTE,
  staleAt: NOW + 11 * MINUTE,
  move: -0.43,
  horizon: 5,
  direction: 'DOWN',
  scope: 'UNKNOWN',
  volumeConfirmed: false,
  times: null,
  spark: null,
  ...over,
});

const renderSignal = (view: SignalView) => {
  stubTrpc((path) => (path === 'views.pulse' ? pulse : {}));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  render(
    <QueryClientProvider client={client}>
      <ChatSignal signal={view} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ChatSignal', () => {
  it('counts down how long a fresh signal is still current', () => {
    renderSignal(signal());

    expect(screen.getByRole('timer').textContent).toBe('актуален ещё 11:00');
  });

  it('says a signal past its time is stale and stops the count', () => {
    renderSignal(signal({ eventAt: NOW - 20 * MINUTE, staleAt: NOW - 5 * MINUTE }));

    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.getByRole('region', { name: 'Сигнал' }).textContent).toMatch(/· устарел$/);
  });
});
