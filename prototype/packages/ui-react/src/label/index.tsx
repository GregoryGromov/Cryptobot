import { labelClass } from '@reinforce/ui-primitives/label';
import { cn } from '@reinforce/ui-styles/cn';
import { Label as LabelPrimitive } from 'radix-ui';
import type * as React from 'react';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root data-slot="label" className={cn(labelClass, className)} {...props} />;
}

export { Label };
