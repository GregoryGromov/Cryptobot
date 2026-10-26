import { type ToggleVariants, toggleVariants } from '@reinforce/ui-primitives/toggle';
import { cn } from '@reinforce/ui-styles/cn';
import { Toggle as TogglePrimitive } from 'radix-ui';
import type * as React from 'react';

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & ToggleVariants) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle };
