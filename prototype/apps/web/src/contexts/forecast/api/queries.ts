import { useQuery } from '@tanstack/react-query';
import { trpc } from '~/shared/api/trpc';

const LIVE_STALE_MS = 30_000;

export const useFanCandles = (threadId: string, live: boolean, visible: boolean) =>
  useQuery(
    trpc.views.threadChart.queryOptions(threadId, {
      staleTime: live ? LIVE_STALE_MS : Number.POSITIVE_INFINITY,
      enabled: (query) => visible && (live || query.state.data === undefined),
      meta: { silent: true },
    }),
  );

export const useForecastWhy = (forecastId: string, enabled = true) =>
  useQuery(
    trpc.views.forecastWhy.queryOptions(forecastId, {
      staleTime: Number.POSITIVE_INFINITY,
      enabled,
      meta: { silent: true },
    }),
  );

export const useForecastInputs = (forecastId: string, enabled = true) =>
  useQuery(
    trpc.views.forecastInputs.queryOptions(forecastId, {
      staleTime: Number.POSITIVE_INFINITY,
      enabled,
      meta: { silent: true },
    }),
  );

export const useEvaluations = (forecastId: string) =>
  useQuery(
    trpc.evaluations.queryOptions(forecastId, {
      staleTime: Number.POSITIVE_INFINITY,
      meta: { silent: true },
    }),
  );
