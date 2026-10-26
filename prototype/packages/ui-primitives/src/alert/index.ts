import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva(
  'glass corner-squircle relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-2xl px-4 py-3 text-foreground text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'glass-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;

export const alertTitleClass = 'col-start-2 min-h-4 font-medium tracking-tight';

export const alertDescriptionClass =
  'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed';
