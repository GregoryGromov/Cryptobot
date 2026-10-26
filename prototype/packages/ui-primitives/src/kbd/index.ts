import { cva, type VariantProps } from 'class-variance-authority';

export const kbdVariants = cva(
  'inline-flex select-none items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1.5 font-medium font-mono text-muted-foreground shadow-[inset_0_-1px_0_0_var(--border)]',
  {
    variants: {
      size: {
        sm: 'h-5 min-w-[1.25rem] text-[0.6875rem]',
        default: 'h-6 min-w-[1.5rem] text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type KbdVariants = VariantProps<typeof kbdVariants>;
