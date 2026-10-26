import { cn } from '@reinforce/ui-styles/cn';
import { PanelLeft } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { useRailFolded, useShellActions } from '../shell-store';
import { railWidthClass } from './rail';
import { SidebarBrand } from './sidebar-brand';
import { SidebarBody, SidebarFoot } from './sidebar-content';
import { TopicSearch } from './topic-search';

export function Sidebar({ active }: { readonly active: string | null }) {
  const { t } = useT('shell');
  const expanded = !useRailFolded();
  const { railToggled } = useShellActions();
  return (
    <aside
      aria-label={t('side.label')}
      className={cn(
        'group/sidebar glass-island glass-lift sticky top-[max(1rem,env(safe-area-inset-top))] z-40 ms-[max(1rem,env(safe-area-inset-left))] mt-[max(1rem,env(safe-area-inset-top))] mb-[max(1rem,env(safe-area-inset-bottom))] hidden h-[calc(100svh-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] shrink-0 flex-col self-start overflow-hidden rounded-(--radius-stage) md:flex',
        railWidthClass(expanded),
      )}
    >
      <div className="relative flex shrink-0 items-center border-foreground/7 border-b px-3 py-4">
        <SidebarBrand
          expanded={expanded}
          className={cn(
            expanded ? 'pe-18' : 'group-hover/sidebar:pointer-events-none group-hover/sidebar:opacity-0',
          )}
        />
        {expanded && <TopicSearch className="absolute start-[calc(100%-5rem)] top-1/2 -translate-y-1/2" />}
        <button
          type="button"
          onClick={railToggled}
          aria-label={expanded ? t('side.fold') : t('side.unfold')}
          aria-expanded={expanded}
          className={cn(
            'focus-ring hover-neutral-soft absolute top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground',
            'transition-[inset-inline-start,opacity,color,background-color] duration-(--motion-duration-standard) ease-emphasized motion-reduce:transition-none',
            expanded
              ? 'start-[calc(100%-2.75rem)] opacity-100'
              : 'start-[calc(50%-1rem)] opacity-0 focus-visible:opacity-100 group-hover/sidebar:opacity-100',
          )}
        >
          <PanelLeft strokeWidth={1.9} className="size-[1.0625rem] rtl:-scale-x-100" />
        </button>
      </div>
      <SidebarBody expanded={expanded} active={active} />
      <SidebarFoot expanded={expanded} />
    </aside>
  );
}
