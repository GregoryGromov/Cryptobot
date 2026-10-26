import { type BadgeVariants, badgeVariants } from '@reinforce/ui-primitives/badge';
import { cn } from '@reinforce/ui-styles/cn';
import { Slot } from 'radix-ui';
import type * as React from 'react';

function Badge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & BadgeVariants & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge };
