'use client';

import { type ToggleVariants, toggleVariants } from '@reinforce/ui-primitives/toggle';
import { toggleGroupClass, toggleGroupItemClass } from '@reinforce/ui-primitives/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type * as React from 'react';

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(toggleGroupClass, className)}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & Pick<ToggleVariants, 'size'>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-size={size ?? 'default'}
      className={cn(toggleVariants({ size }), toggleGroupItemClass, className)}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
