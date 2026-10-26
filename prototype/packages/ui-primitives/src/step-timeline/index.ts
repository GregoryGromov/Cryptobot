import { cva } from 'class-variance-authority';

export type StepTimelineStatus = 'pending' | 'active' | 'done' | 'attention';

export type StepTimelineDensity = 'default' | 'compact';

export const stepTimelineOrdinalGapClass: Record<StepTimelineDensity, string> = {
  default: 'pb-4 short:pb-2 sm:pb-7',
  compact: 'pb-3 short:pb-2 sm:pb-6',
};

export const stepTimelineChipVariants = cva(
  'grid size-7 shrink-0 place-items-center rounded-full font-figure font-semibold text-xs ring-1 ring-inset transition-colors [&_svg]:size-3.5',
  {
    variants: {
      status: {
        pending: 'bg-muted text-muted-foreground ring-border',
        active: 'tone-primary bg-tone-bg text-tone-fg ring-tone-ring',
        done: 'tone-success bg-tone-bg text-tone-fg ring-tone-ring',
        attention: 'tone-warning bg-tone-bg text-tone-fg ring-tone-ring',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  },
);

export const stepTimelineStatusChipVariants = cva(
  'grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset',
  {
    variants: {
      status: {
        pending: 'bg-muted/40 text-muted-foreground/50 ring-border/60',
        active: 'tone-primary bg-tone-bg text-tone-fg ring-tone-ring',
        done: 'tone-success bg-tone-bg text-tone-fg ring-tone-ring',
        attention: 'tone-warning bg-tone-bg text-tone-fg ring-tone-ring',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  },
);
