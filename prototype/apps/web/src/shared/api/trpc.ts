import type { AppRouter } from '@reinforce/server/router';
import { createTRPCClient } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { mockLink } from './mock/link';
import { queryClient } from './query-client';

export const trpcClient = createTRPCClient<AppRouter>({ links: [mockLink] });

export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
