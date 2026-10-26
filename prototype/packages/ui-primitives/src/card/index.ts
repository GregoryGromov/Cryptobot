import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'glass corner-squircle flex flex-col rounded-(--radius-card) text-card-foreground transition-colors',
  {
    variants: {
      size: {
        sm: 'gap-4 py-4',
        default: 'gap-6 py-6',
        lg: 'gap-8 py-8',
      },
      interactive: {
        true: 'glass-hover',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      interactive: false,
    },
  },
);

export type CardVariants = VariantProps<typeof cardVariants>;

export const stageClass = 'glass-strong stage-glow corner-squircle rounded-(--radius-stage)';

export const stagePadClass = 'p-5 sm:p-7';
export const stageHeadClass = 'flex min-h-8 items-center justify-between gap-3';
export const stageSentenceClass = 'text-foreground-soft text-row';
export const stageFootClass =
  'mt-5 flex flex-wrap items-center gap-x-4.5 gap-y-2 border-foreground/7 border-t pt-3.5 text-foreground-soft text-meta';

export const pageStripClass =
  'glass flex items-center gap-3 rounded-(--radius-card) px-4 py-3.5 [&>svg]:size-4.5 [&>svg]:shrink-0';
export const pageStripTitleClass = 'font-medium text-foreground text-sm';
export const sectionCardClass = 'glass corner-squircle rounded-(--radius-card) px-6 pt-6 pb-2';
export const sectionCardHeadClass = 'flex min-h-7 items-center justify-between gap-4';
export const sectionCardLinkClass =
  'focus-ring inline-flex items-center gap-0.5 whitespace-nowrap rounded-sm font-medium text-foreground-soft text-meta transition-colors hover:text-foreground [&_svg]:size-[0.9375rem]';
