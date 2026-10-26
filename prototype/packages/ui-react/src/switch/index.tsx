'use client';

import {
  type SwitchRootVariants,
  switchRootVariants,
  switchThumbVariants,
} from '@reinforce/ui-primitives/switch';
import { cn } from '@reinforce/ui-styles/cn';
import { Switch as SwitchPrimitive } from 'radix-ui';
import type * as React from 'react';

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & SwitchRootVariants) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchRootVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
