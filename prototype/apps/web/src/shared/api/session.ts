import { useQuery } from '@tanstack/react-query';
import { trpc } from './trpc';

const sessionQueryOptions = () => trpc.views.session.queryOptions();

export const useSession = () => useQuery(sessionQueryOptions());
