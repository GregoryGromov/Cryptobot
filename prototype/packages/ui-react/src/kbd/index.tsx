import { type KbdVariants, kbdVariants } from '@reinforce/ui-primitives/kbd';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

export function Kbd({ className, size = 'default', ...props }: React.ComponentProps<'kbd'> & KbdVariants) {
  return <kbd data-slot="kbd" data-size={size} className={cn(kbdVariants({ size }), className)} {...props} />;
}
