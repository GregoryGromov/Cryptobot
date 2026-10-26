import { type Candle, CHART_BARS, MOST_CHART_BARS } from '@reinforce/server/dto';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Frame } from '~/contexts/markets/domain/chart-vm';
import { trpc } from '~/shared/api/trpc';

export type CandleRead =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'ready'; readonly candles: readonly Candle[] };

type Reach = { readonly key: string; readonly bars: number; readonly oldest: number };

/** A market's candles in a frame, reaching further back each time the person scrolls to the first of them. */
export function useCandleHistory(coin: string, frame: Frame): { read: CandleRead; reachBack: () => void } {
  const queryClient = useQueryClient();
  const key = `${coin}|${frame}`;
  const [reach, setReach] = useState<Reach | null>(null);
  if (reach && reach.key !== key) setReach(null);
  const bars = reach?.key === key ? reach.bars : CHART_BARS;
  const inputFor = (n: number) => (n > CHART_BARS ? { coin, frame, bars: n } : { coin, frame });
  // While a longer reach loads, and if it fails, the chart keeps the shorter one it had.
  const shorter = () =>
    bars > CHART_BARS
      ? queryClient.getQueryData(trpc.views.candles.queryKey(inputFor(bars - CHART_BARS)))
      : undefined;
  const query = useQuery(trpc.views.candles.queryOptions(inputFor(bars), { placeholderData: shorter }));
  const candles = query.data ?? shorter();
  const read: CandleRead = candles
    ? { kind: 'ready', candles }
    : query.isError
      ? { kind: 'failed' }
      : { kind: 'loading' };
  const reachBack = () => {
    const oldest = candles?.[0]?.t;
    if (oldest === undefined || query.isFetching || query.isError || bars >= MOST_CHART_BARS) return;
    // The last reach brought nothing older: the market's history ends here.
    if (reach?.key === key && oldest >= reach.oldest) return;
    setReach({ key, bars: Math.min(bars + CHART_BARS, MOST_CHART_BARS), oldest });
  };
  return { read, reachBack };
}
