import { cn } from '@reinforce/ui-styles/cn';
import { AccountCorner } from '~/contexts/account/ui/account-corner';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AgentsPanel } from '~/contexts/agents/ui/agents-panel';

export function SidebarBody({
  expanded,
  active,
  onNavigate,
}: {
  readonly expanded: boolean;
  readonly active: string | null;
  readonly onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <AppBoundary tier="panel" scope="agents">
          <AgentsPanel expanded={expanded} active={active} onNavigate={onNavigate} />
        </AppBoundary>
      </div>
    </div>
  );
}

export function SidebarFoot({ expanded }: { readonly expanded: boolean }) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-2 border-foreground/7 border-t p-3 empty:hidden',
        !expanded && 'items-center',
      )}
    >
      <AppBoundary tier="panel" scope="account">
        <AccountCorner compact={!expanded} />
      </AppBoundary>
    </div>
  );
}
