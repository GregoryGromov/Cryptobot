import { cn } from '@reinforce/ui-styles/cn';
import { type ReactNode, useRef } from 'react';
import { useArrival } from '~/shared/hooks/use-arrival';

/**
 * The one bar at the top of every page, in the same place and of the same shape everywhere, so moving between pages
 * changes only what is in it. `fit` draws it as small as its contents and lets the page through around it.
 */
export function HeadBar({
  children,
  fit = false,
  className,
}: {
  readonly children: ReactNode;
  readonly fit?: boolean;
  readonly className?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  useArrival(content, 'head');
  return (
    <header
      data-head-bar=""
      className={cn(
        'sticky top-0 z-20 flex px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 md:px-8 md:pt-[max(1rem,env(safe-area-inset-top))]',
        fit ? 'pointer-events-none' : 'header-scrim before:end-0',
        className,
      )}
    >
      <div
        className={cn(
          'glass-island glass-lift pointer-events-auto flex h-12 min-w-0 items-center rounded-full ps-1 pe-1.5',
          fit ? 'w-fit' : 'flex-1',
        )}
      >
        <div ref={content} className="flex h-full min-w-0 flex-1 items-center gap-1.5">
          {children}
        </div>
      </div>
    </header>
  );
}
