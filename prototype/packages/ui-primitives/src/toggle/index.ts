import { cva, type VariantProps } from 'class-variance-authority';

export const toggleVariants = cva(
  "focus-ring disabled-state motion-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-muted-foreground text-sm transition-colors hover:text-foreground aria-invalid:border-destructive aria-invalid:ring-ring-destructive data-[state=on]:border-border-control data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'border border-transparent hover:bg-foreground/6',
        outline: 'border border-border hover:bg-foreground/6',
      },
      size: {
        default: 'h-9 min-w-9 px-2',
        sm: 'h-8 min-w-8 px-1.5',
        lg: 'h-10 min-w-10 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
