import { Button } from '@reinforce/ui-react/button';
import { Heading } from '@reinforce/ui-react/typography';
import { createRouter, type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router';
import { routeTree } from '~/routeTree.gen';
import { queryClient } from '~/shared/api/query-client';
import { board } from '~/shared/hooks/use-arrival';
import { useT } from '~/shared/i18n';
import { NotFound } from './not-found';

function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const { t } = useT('common');
  return (
    <div
      role="alert"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <Heading as="h1" size="h1">
        {t('router.errorTitle')}
      </Heading>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          {t('retry')}
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">{t('router.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
  scrollRestoration: true,
});

router.subscribe('onBeforeNavigate', ({ pathChanged }) => {
  if (pathChanged) board();
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
