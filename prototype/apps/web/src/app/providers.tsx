import { Toaster } from '@reinforce/ui-react/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { usePulse } from '~/shared/api/live';
import { queryClient } from '~/shared/api/query-client';
import { useSession } from '~/shared/api/session';
import { useIsDesktop } from '~/shared/hooks/use-media-query';
import { followServerLocale } from '~/shared/i18n';
import { ThemeEffects, useResolvedTheme } from './theme/theme-store';

export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffects />
      <ThemedToaster />
      <LiveUpdates />
      <ServerLocale />
      {children}
    </QueryClientProvider>
  );
}

function ThemedToaster() {
  const theme = useResolvedTheme();
  const desktop = useIsDesktop();
  return <Toaster theme={theme} position={desktop ? 'bottom-right' : 'top-center'} visibleToasts={2} />;
}

function LiveUpdates() {
  usePulse();
  return null;
}

function ServerLocale() {
  const locale = useSession().data?.locale;
  useEffect(() => {
    if (locale) followServerLocale(locale);
  }, [locale]);
  return null;
}
