import { cva, type VariantProps } from 'class-variance-authority';

export const textareaVariants = cva(
  'focus-ring disabled-state field-sizing-content flex w-full rounded-md border border-border-control bg-input-bg transition-[color,box-shadow] placeholder:text-muted-foreground hover:border-foreground/60 focus-visible:border-ring/60 aria-invalid:border-destructive/60 aria-invalid:ring-ring-destructive md:text-sm',
  {
    variants: {
      size: {
        sm: 'min-h-16 px-2.5 py-1.5 text-sm',
        default: 'min-h-20 px-3 py-2 text-base',
        lg: 'min-h-28 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type TextareaVariants = VariantProps<typeof textareaVariants>;
