import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'focus-ring disabled-state w-full min-w-0 rounded-md border border-border-control bg-input-bg transition-[color,box-shadow] file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground hover:border-foreground/60 focus-visible:border-ring/60 aria-invalid:border-destructive/60 aria-invalid:ring-ring-destructive md:text-sm',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 py-1 text-sm file:h-6',
        default: 'h-9 px-3 py-1 text-base file:h-7',
        lg: 'h-10 px-4 py-2 text-base file:h-7',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type InputVariants = VariantProps<typeof inputVariants>;
