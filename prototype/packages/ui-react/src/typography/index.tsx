import {
  type HeadingSize,
  headingVariants,
  type TextVariants,
  textVariants,
} from '@reinforce/ui-primitives/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Slot } from 'radix-ui';
import type * as React from 'react';

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type HeadingProps = Omit<React.ComponentProps<'h1'>, 'size'> & {
  readonly as: HeadingElement;
  readonly size: HeadingSize;
};

function Heading({ as: Comp, className, size, ...props }: HeadingProps) {
  return (
    <Comp
      data-slot="heading"
      data-size={size}
      className={cn(headingVariants({ size }), className)}
      {...props}
    />
  );
}

function Text({
  className,
  variant = 'body',
  asChild = false,
  ...props
}: React.ComponentProps<'p'> & TextVariants & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'p';

  return (
    <Comp
      data-slot="text"
      data-variant={variant}
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Heading, Text };
