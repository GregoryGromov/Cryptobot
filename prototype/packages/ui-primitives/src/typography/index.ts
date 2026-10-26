import { cva, type VariantProps } from 'class-variance-authority';

export const headingVariants = cva('scroll-m-20 text-foreground', {
  variants: {
    size: {
      display:
        'text-balance font-bold leading-[0.95] tracking-[-0.045em] [font-size:clamp(2.75rem,6vw,5.5rem)]',
      h1: 'text-balance font-bold text-4xl tracking-[-0.03em] lg:text-5xl',
      'h1-compact': 'text-balance font-bold text-3xl tracking-[-0.03em] lg:text-4xl',
      h2: 'text-balance border-b pb-2 font-semibold text-3xl tracking-[-0.025em] first:mt-0',
      page: 'font-[650] text-2xl leading-[1.875rem] tracking-[-0.02em]',
      section: 'font-semibold text-[1.0625rem] leading-6 tracking-[-0.01em]',
      h3: 'text-balance font-semibold text-2xl tracking-tight',
      h4: 'font-semibold text-xl tracking-tight',
      h5: 'font-semibold text-lg tracking-tight',
      h6: 'font-semibold text-base tracking-tight',
    },
  },
});

type HeadingVariants = VariantProps<typeof headingVariants>;
export type HeadingSize = NonNullable<HeadingVariants['size']>;

export const textVariants = cva('', {
  variants: {
    variant: {
      lead: 'text-pretty text-muted-foreground text-xl',
      subtitle: 'text-pretty text-base text-muted-foreground md:text-lg',
      body: 'text-pretty leading-7 [&:not(:first-child)]:mt-6',
      small: 'font-medium text-sm leading-none',
      muted: 'text-muted-foreground text-sm',
      overline:
        'font-semibold text-[0.6875rem] text-muted-foreground uppercase leading-none tracking-[0.12em]',
      mono: 'font-mono text-sm',
      numeric: 'font-figure text-sm',
      'numeric-card': 'font-figure font-semibold text-3xl tracking-[-0.02em] md:text-4xl',
      'numeric-amount':
        'font-figure font-semibold leading-none tracking-[-0.02em] [font-size:clamp(1.75rem,5vw,2.5rem)]',
      'numeric-display':
        'font-figure font-semibold leading-none tracking-[-0.02em] [font-size:clamp(2rem,4.5vw,3.5rem)]',
      'numeric-hero':
        'font-figure font-semibold leading-[1.077] tracking-[-0.035em] [font-size:clamp(2rem,16cqi,3.25rem)]',
      'numeric-hero-unit':
        'font-figure font-semibold text-muted-foreground leading-[1.2] tracking-normal [font-size:clamp(0.8rem,6.2cqi,1.25rem)]',
    },
  },
  defaultVariants: { variant: 'body' },
});

export type TextVariants = VariantProps<typeof textVariants>;
