import { toast } from '@reinforce/ui-react/sonner';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { errorText, isClientError, isTransportError } from './error-map';
import { RejectedError } from './rejection';

const isSilent = (meta: Record<string, unknown> | undefined): boolean => meta?.silent === true;

const toastedQueries = new Set<string>();

const queryCache = new QueryCache({
  onError: (error, query) => {
    if (isSilent(query.meta) || isTransportError(error) || toastedQueries.has(query.queryHash)) return;
    toastedQueries.add(query.queryHash);
    toast.error(errorText(error));
  },
  onSuccess: (_data, query) => {
    toastedQueries.delete(query.queryHash);
  },
});

queryCache.subscribe((event) => {
  if (event.type === 'removed') toastedQueries.delete(event.query.queryHash);
});

const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (isSilent(mutation.meta)) return;
    toast.error(error instanceof RejectedError ? error.message : errorText(error));
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
    },
    mutations: { retry: false },
  },
});
