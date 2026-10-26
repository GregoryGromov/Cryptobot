import { cva, type VariantProps } from 'class-variance-authority';

export const skeletonClass = 'skeleton-block rounded-md';

export const skeletonLinesVariants = cva('skeleton-lines', {
  variants: {
    surface: {
      default: '',
      primary: 'skeleton-on-primary',
    },
  },
  defaultVariants: { surface: 'default' },
});

export type SkeletonLinesVariants = VariantProps<typeof skeletonLinesVariants>;
