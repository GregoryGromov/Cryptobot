import { cva } from 'class-variance-authority';

export const listRowVariants = cva('grid items-center text-start', {
  variants: {
    density: {
      regular: 'gap-x-3.5 py-3 [&+&]:border-foreground/7 [&+&]:border-t',
      compact: 'gap-x-3 py-2',
    },
    trail: { false: '', true: '' },
  },
  compoundVariants: [
    { density: 'regular', trail: false, class: 'grid-cols-[2.125rem_minmax(0,1fr)_auto]' },
    { density: 'regular', trail: true, class: 'grid-cols-[2.125rem_minmax(0,1fr)_auto_1rem]' },
    { density: 'compact', trail: false, class: 'grid-cols-[1.875rem_minmax(0,1fr)_auto]' },
    { density: 'compact', trail: true, class: 'grid-cols-[1.875rem_minmax(0,1fr)_auto_1rem]' },
  ],
  defaultVariants: { density: 'regular', trail: false },
});

export const listRowDiscVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
  {
    variants: {
      density: {
        regular: 'size-8.5 [&_svg]:size-4',
        compact: 'size-7.5 bg-transparent [&_svg]:size-3.5',
      },
      tone: {
        neutral: 'bg-foreground/5 text-foreground-soft ring-foreground/12',
        success: 'tone-success bg-tone-bg text-tone-fg ring-tone-ring',
        primary: 'tone-primary bg-tone-bg text-tone-fg ring-tone-ring',
        warning: 'tone-warning bg-tone-bg text-tone-fg ring-tone-ring',
        destructive: 'tone-destructive bg-tone-bg text-tone-fg ring-tone-ring',
      },
    },
    compoundVariants: [
      { density: 'compact', tone: 'neutral', class: 'bg-transparent ring-foreground/14' },
      { density: 'compact', tone: 'primary', class: 'bg-transparent ring-primary/45' },
    ],
    defaultVariants: { density: 'regular', tone: 'neutral' },
  },
);

export const listRowCopyClass = 'flex min-w-0 flex-col';

export const listRowTitleVariants = cva('truncate font-medium text-foreground', {
  variants: { density: { regular: 'text-row', compact: 'text-sm' } },
  defaultVariants: { density: 'regular' },
});

export const listRowMetaVariants = cva('truncate text-muted-foreground', {
  variants: { density: { regular: 'text-meta', compact: 'text-xs' } },
  defaultVariants: { density: 'regular' },
});

export const listRowFigureClass = 'whitespace-nowrap text-end';

export const listRowGroupLabelClass = 'mt-1.5 font-semibold text-muted-foreground text-xs first:mt-2';

export const listRowMoreClass = 'mt-1.5 self-center text-meta [&_svg]:size-3.5';
