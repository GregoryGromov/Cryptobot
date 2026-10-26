import type { Candle } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Frame } from '~/contexts/markets/domain/chart-vm';
import { trpc } from '~/shared/api/trpc';
import { useCandleHistory } from './use-candle-history';

const candle = (t: number): Candle => ({ t, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 });
const LATEST = [candle(3000), candle(4000)];
const OLDER = [candle(1000), candle(2000), ...LATEST];
const OLDEST = [candle(0), ...OLDER];

function setup(seed: (client: QueryClient) => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  seed(queryClient);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(({ frame }: { frame: Frame }) => useCandleHistory('BTC', frame), {
    wrapper,
    initialProps: { frame: '5m' as Frame },
  });
}

const shown = (read: ReturnType<typeof useCandleHistory>['read']) =>
  read.kind === 'ready' ? read.candles.map((c) => c.t) : read.kind;

describe('useCandleHistory', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
  });

  it('shows the latest candles first', () => {
    const { result } = setup((client) => {
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m' }), LATEST);
    });
    expect(shown(result.current.read)).toEqual([3000, 4000]);
  });

  it('brings older candles once the person reaches the first one', () => {
    const { result } = setup((client) => {
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m' }), LATEST);
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m', bars: 2000 }), OLDER);
    });
    act(() => result.current.reachBack());
    expect(shown(result.current.read)).toEqual([1000, 2000, 3000, 4000]);
  });

  it('stops reaching back when a reach brought nothing older', () => {
    const { result } = setup((client) => {
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m' }), LATEST);
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m', bars: 2000 }), LATEST);
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m', bars: 3000 }), OLDEST);
    });
    act(() => result.current.reachBack());
    act(() => result.current.reachBack());
    expect(shown(result.current.read)).toEqual([3000, 4000]);
  });

  it('keeps the candles it has when older ones fail to load', async () => {
    const { result } = setup((client) => {
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m' }), LATEST);
    });
    act(() => result.current.reachBack());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(shown(result.current.read)).toEqual([3000, 4000]);
  });

  it('starts from the latest candles again on another frame', () => {
    const { result, rerender } = setup((client) => {
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m' }), LATEST);
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '5m', bars: 2000 }), OLDER);
      client.setQueryData(trpc.views.candles.queryKey({ coin: 'BTC', frame: '1h' }), [candle(0)]);
    });
    act(() => result.current.reachBack());
    rerender({ frame: '1h' });
    rerender({ frame: '5m' });
    expect(shown(result.current.read)).toEqual([3000, 4000]);
  });
});
