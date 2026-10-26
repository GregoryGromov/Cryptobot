import { cn } from '@reinforce/ui-styles/cn';

const RAIL_STANDARD = 'duration-(--motion-duration-standard) ease-emphasized motion-reduce:transition-none';
const RAIL_QUICK = 'duration-(--motion-duration-quick) ease-standard motion-reduce:transition-none';

export const railSlotClass = (expanded: boolean): string =>
  cn(
    'flex shrink-0 items-center justify-center transition-[width]',
    RAIL_STANDARD,
    expanded ? 'w-10' : 'w-14',
  );

export const railRowClass = (expanded: boolean): string =>
  cn(
    'focus-ring hover-neutral-soft group/row flex h-10 w-full shrink-0 items-center rounded-md text-foreground-soft transition-colors',
    'aria-[current=page]:bg-foreground/7 aria-[current=page]:font-semibold aria-[current=page]:text-foreground aria-[current=page]:ring-1 aria-[current=page]:ring-foreground/6 aria-[current=page]:ring-inset',
    RAIL_QUICK,
    expanded && 'pe-2.5',
  );

export const railIconClass =
  'size-4.5 text-muted-foreground group-hover/row:text-foreground group-aria-[current=page]/row:text-foreground';

export const railLabelClass = (expanded: boolean): string =>
  cn(
    'min-w-0 flex-1 overflow-hidden truncate text-start text-sm transition-opacity',
    RAIL_QUICK,
    expanded ? 'opacity-100' : 'opacity-0',
  );

export const railFadeClass = (shown: boolean): string =>
  cn('pointer-events-none transition-opacity', RAIL_QUICK, shown ? 'opacity-100' : 'opacity-0');

export const railWidthClass = (expanded: boolean): string =>
  cn('transition-[width]', RAIL_STANDARD, expanded ? 'w-68' : 'w-20');

export const unreadDotClass =
  'absolute -end-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background';
