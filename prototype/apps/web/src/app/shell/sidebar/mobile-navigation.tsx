import { Separator } from '@reinforce/ui-react/separator';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@reinforce/ui-react/sheet';
import { X } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { useNavigationOpen, useShellActions } from '../shell-store';
import { SidebarBrand } from './sidebar-brand';
import { SidebarBody, SidebarFoot } from './sidebar-content';
import { TopicSearch } from './topic-search';

export function MobileNavigation({ active }: { readonly active: string | null }) {
  const { t } = useT(['shell', 'common']);
  const open = useNavigationOpen();
  const { navigationOpenChanged, navigationClosed } = useShellActions();
  return (
    <Sheet open={open} onOpenChange={navigationOpenChanged}>
      <SheetContent
        side="left"
        withOverlay={false}
        closeButton={false}
        className="glass-island glass-lift inset-y-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] flex h-auto w-[min(18rem,calc(100vw-2rem))] flex-col gap-0 rounded-xl p-0 md:hidden"
      >
        <SheetTitle className="sr-only">{t('side.label')}</SheetTitle>
        <SheetDescription className="sr-only">{t('topics.label')}</SheetDescription>
        <div className="flex h-16 shrink-0 items-center gap-1 px-3">
          <SidebarBrand expanded onNavigate={navigationClosed} />
          <TopicSearch className="shrink-0" onNavigate={navigationClosed} />
          <SheetClose
            aria-label={t('common:close')}
            className="focus-ring hover-neutral-soft inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
          >
            <X strokeWidth={1.9} className="size-[1.0625rem]" />
          </SheetClose>
        </div>
        <Separator />
        <SidebarBody expanded active={active} onNavigate={navigationClosed} />
        <SidebarFoot expanded />
      </SheetContent>
    </Sheet>
  );
}
