import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'focus-ring inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent font-medium aria-invalid:border-destructive aria-invalid:ring-ring-destructive [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'badge-chip-primary bg-primary text-primary-foreground',
        secondary: 'badge-chip-secondary bg-secondary text-secondary-foreground',
        destructive: 'badge-chip-destructive bg-destructive text-white focus-visible:ring-ring-destructive',
        outline: 'hover-glass-tint border-border text-foreground hover:border-primary/35 hover:text-primary',
        ghost: 'hover-glass-tint hover:text-primary',
        link: 'link-underline-slide text-primary',
      },
      size: {
        sm: 'h-5 px-1.5 text-[0.6875rem]',
        default: 'h-6 px-2 text-xs',
        lg: 'h-7 px-2.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
