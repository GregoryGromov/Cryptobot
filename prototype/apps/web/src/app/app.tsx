import { RouterProvider } from '@tanstack/react-router';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { Providers } from './providers';
import { router } from './router';

export function App() {
  return (
    <AppBoundary tier="root" scope="app">
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </AppBoundary>
  );
}
