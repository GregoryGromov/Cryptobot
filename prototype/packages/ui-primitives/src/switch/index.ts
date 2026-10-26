import { cva, type VariantProps } from 'class-variance-authority';

export const switchRootVariants = cva(
  'focus-ring disabled-state touch-target peer group/switch relative inline-flex shrink-0 items-center rounded-full px-0.5 transition-colors data-[state=checked]:bg-switch-track-checked data-[state=unchecked]:bg-switch-track',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        default: 'h-6.5 w-11',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type SwitchRootVariants = VariantProps<typeof switchRootVariants>;

export const switchThumbVariants = cva(
  'pointer-events-none block rounded-full ring-0 transition-transform data-[state=checked]:bg-switch-thumb-checked data-[state=unchecked]:bg-switch-thumb',
  {
    variants: {
      size: {
        sm: 'size-3 data-[state=checked]:translate-x-full data-[state=unchecked]:translate-x-0',
        default:
          'size-5.5 data-[state=checked]:translate-x-[calc(100%-0.25rem)] data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
