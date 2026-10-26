import { cva, type VariantProps } from 'class-variance-authority';

export const inlineNoteVariants = cva(
  'flex bg-tone-bg ring-1 ring-tone-ring ring-inset [&>svg]:shrink-0 [&>svg]:text-tone-fg',
  {
    variants: {
      tone: {
        warning: 'tone-warning',
        neutral: 'tone-neutral',
      },
      size: {
        default: 'gap-2.5 rounded-xl p-3 [&>svg]:size-4',
        sm: 'gap-2 rounded-lg px-2.5 py-1.5 [&>svg]:size-3.5',
      },
      align: {
        start: 'w-full items-start text-left [&>svg]:mt-px',
        center: 'mx-auto w-fit max-w-full items-center justify-center text-center',
      },
    },
    defaultVariants: {
      tone: 'warning',
      size: 'default',
      align: 'start',
    },
  },
);

export type InlineNoteTone = NonNullable<VariantProps<typeof inlineNoteVariants>['tone']>;
export type InlineNoteSize = NonNullable<VariantProps<typeof inlineNoteVariants>['size']>;
export type InlineNoteAlign = NonNullable<VariantProps<typeof inlineNoteVariants>['align']>;

export const inlineNoteContentVariants = cva('flex min-w-0 flex-col gap-0.5', {
  variants: {
    align: {
      start: 'flex-1',
      center: 'items-center',
    },
  },
  defaultVariants: { align: 'start' },
});

export const inlineNoteTextVariants = cva('min-w-0 font-medium text-foreground leading-snug', {
  variants: {
    size: {
      default: 'text-[0.8125rem]',
      sm: 'text-xs',
    },
    align: {
      start: 'flex-1',
      center: '',
    },
  },
  defaultVariants: { size: 'default', align: 'start' },
});

export const inlineNoteTitleClass = 'font-semibold text-[0.8125rem] text-foreground leading-snug';

export const inlineNoteBodyClass = 'text-[0.8125rem] text-muted-foreground leading-snug';
