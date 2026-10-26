import { cva, type VariantProps } from 'class-variance-authority';

const lift = 'motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-[0.5px]';
const iconLift =
  'motion-safe:hover:translate-y-0 motion-safe:active:translate-y-0 motion-safe:hover:scale-105 motion-safe:active:scale-100';

const loadingState =
  'relative data-[loading=true]:cursor-wait data-[loading=true]:pointer-events-none [&[data-loading=true]>:not([data-slot=button-spinner])]:invisible';

export const buttonSpinnerClass =
  'absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-spin';

export const buttonVariants = cva(
  `focus-ring disabled-state touch-target ${loadingState} inline-flex shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-[var(--motion-duration-quick)] ease-[var(--motion-ease-standard)] aria-invalid:border-destructive aria-invalid:ring-ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.0625rem]`,
  {
    variants: {
      variant: {
        default: `btn-cta font-semibold ${lift}`,
        destructive: `btn-cta-destructive focus-ring-destructive font-semibold ${lift}`,
        secondary: 'btn-cta-secondary motion-press font-medium',
        ghost: 'btn-ghost-soft font-semibold',
        'ghost-destructive': 'btn-ghost-destructive focus-ring-destructive font-semibold',
        link: 'link-underline-slide rounded-md font-semibold text-link',
      },
      size: {
        sm: 'h-8.5 gap-1.5 px-3.5 text-[0.8125rem] has-[>svg]:px-3',
        compact: 'h-10 px-4 text-sm has-[>svg]:px-4',
        md: 'h-10.5 px-5 text-sm has-[>svg]:px-4',
        lg: 'h-11 px-5 text-[0.9375rem] has-[>svg]:px-4.5',
        xl: 'h-auto min-h-14 px-5 py-3 text-[0.9375rem] has-[>svg]:px-4',
        cta: 'h-auto min-h-13 w-full px-6 py-1.5 text-[0.9375rem] leading-snug has-[>svg]:px-5',
        'icon-sm': 'size-8',
        'icon-md': 'size-9',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      { size: 'icon-sm', class: iconLift },
      { size: 'icon-md', class: iconLift },
      { size: 'icon-lg', class: iconLift },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export const ctaButtonStackClass = 'flex-col gap-0';
export const ctaButtonMainClass = 'leading-tight';
export const ctaButtonSubClass = 'font-medium text-xs leading-tight opacity-85';
