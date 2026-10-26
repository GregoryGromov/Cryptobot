import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { RouterContext } from '~/app/router-context';
import { AppShell } from '~/app/shell/app-shell';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});

function Root() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
