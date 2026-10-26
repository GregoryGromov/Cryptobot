import { useRouter, useRouterState } from '@tanstack/react-router';
import { type ReactNode, useEffect, useRef } from 'react';
import { MarketPickerHost } from '~/app/market-picker/market-picker';
import { SignInHost } from '~/contexts/account/ui/sign-in';
import { useArrival } from '~/shared/hooks/use-arrival';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { activeTopicOf, isConversationPath, shellRouteOf } from './domain/shell-route';
import { ShellHeader } from './header/shell-header';
import { ShellNotes } from './header/shell-notes';
import { MobileNavigation } from './sidebar/mobile-navigation';
import { Sidebar } from './sidebar/sidebar';
import { useDocumentTitle } from './use-document-title';

const focusMain = (): void => {
  const main = document.getElementById('main');
  const focused = document.activeElement;
  if (!main || (focused !== main && focused !== null && main.contains(focused))) return;
  main.focus({ preventScroll: true });
};

const useMainFocus = (): void => {
  const router = useRouter();
  useEffect(
    () =>
      router.subscribe('onResolved', ({ pathChanged }) => {
        if (pathChanged) focusMain();
      }),
    [router],
  );
};

function Arrive({ children }: { readonly children: ReactNode }) {
  const page = useRef<HTMLDivElement>(null);
  useArrival(page, 'page');
  return (
    <div ref={page} className="flex min-w-0 flex-1 flex-col">
      {children}
    </div>
  );
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { t } = useT('common');
  // The page on screen, not the one being loaded: the shell changes with the page, never a frame before it.
  const pathname = useRouterState({
    select: (state) => state.matches.at(-1)?.pathname ?? state.location.pathname,
  });
  const route = shellRouteOf(pathname);
  const active = activeTopicOf(route);
  const conversation = isConversationPath(pathname);
  useDocumentTitle(route);
  useMainFocus();
  return (
    <div className="flex min-h-svh">
      <a
        href="#main"
        className="focus-ring sr-only fixed start-2 top-2 z-50 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm shadow-lg focus:not-sr-only"
      >
        {t('skipToContent')}
      </a>
      <AppBoundary tier="section" scope="sidebar" fallback={() => null}>
        <Sidebar active={active} />
      </AppBoundary>
      <div className="flex min-w-0 flex-1 flex-col">
        {!conversation && (
          <AppBoundary tier="panel" scope="header">
            <ShellHeader />
            <ShellNotes />
          </AppBoundary>
        )}
        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
          {route.kind === 'section' ? <Arrive key={route.section}>{children}</Arrive> : children}
        </main>
      </div>
      <AppBoundary tier="panel" scope="mobile-navigation" fallback={() => null}>
        <MobileNavigation active={active} />
      </AppBoundary>
      <AppBoundary tier="panel" scope="market-picker" fallback={() => null}>
        <MarketPickerHost />
      </AppBoundary>
      <AppBoundary tier="panel" scope="sign-in" fallback={() => null}>
        <SignInHost />
      </AppBoundary>
    </div>
  );
}
