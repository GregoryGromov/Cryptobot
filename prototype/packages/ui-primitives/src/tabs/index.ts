import { cva, type VariantProps } from 'class-variance-authority';

export const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center gap-1 rounded-md p-1 text-muted-foreground data-[variant=line]:rounded-none group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'surface-inset',
        line: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type TabsListVariants = VariantProps<typeof tabsListVariants>;

export const tabsRootClass = 'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col';

export const tabsTriggerVariants = cva(
  [
    "focus-ring disabled-state motion-press touch-target relative inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius-control)-0.25rem)] border border-transparent font-medium text-muted-foreground text-sm transition-colors hover:text-foreground group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    'group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none',
    'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
    'data-[state=active]:bg-card data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:border-border-control',
    'before:absolute before:bg-foreground before:opacity-0 before:transition-opacity group-data-[orientation=horizontal]/tabs:before:inset-x-0 group-data-[orientation=vertical]/tabs:before:inset-y-0 group-data-[orientation=vertical]/tabs:before:-right-1 group-data-[orientation=horizontal]/tabs:before:bottom-[-5px] group-data-[orientation=horizontal]/tabs:before:h-0.5 group-data-[orientation=vertical]/tabs:before:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:before:opacity-100',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-7 px-2',
        default: 'h-8 px-2.5',
        lg: 'h-9 px-3',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export type TabsTriggerVariants = VariantProps<typeof tabsTriggerVariants>;

export const tabsContentClass = 'flex-1 outline-none';
