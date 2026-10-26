import type { Candle } from '@reinforce/server/dto';
import { useQueries } from '@tanstack/react-query';
import type { Frame } from '~/contexts/markets/domain/chart-vm';
import { trpc } from '~/shared/api/trpc';

export type ComparedCandles = { readonly coin: string; readonly candles: readonly Candle[] | null };

/** The latest candles of each market compared, in the order given; null while one loads or when it failed. */
export function useComparedCandles(coins: readonly string[], frame: Frame): readonly ComparedCandles[] {
  return useQueries({
    queries: coins.map((coin) =>
      trpc.views.candles.queryOptions({ coin, frame }, { meta: { silent: true } }),
    ),
    combine: (results) =>
      results.map((result, i) => ({ coin: coins[i] ?? '', candles: result.data ?? null })),
  });
}
