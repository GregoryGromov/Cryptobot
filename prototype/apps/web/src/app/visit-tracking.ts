import type { AnyRouter } from '@tanstack/react-router';
import { trpcClient } from '~/shared/api/trpc';

const visit = (): void => {
  if (document.visibilityState === 'visible') void trpcClient.account.visit.mutate().catch(() => undefined);
};

export const installVisitTracking = (router: AnyRouter): (() => void) => {
  const unsubscribe = router.subscribe('onResolved', visit);
  document.addEventListener('visibilitychange', visit);
  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', visit);
  };
};
