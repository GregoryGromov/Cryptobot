import { type CardVariants, cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

function Card({ className, size, interactive, ...props }: React.ComponentProps<'div'> & CardVariants) {
  return (
    <div
      data-slot="card"
      data-size={size ?? 'default'}
      className={cn(cardVariants({ size, interactive }), className)}
      {...props}
    />
  );
}

export { Card };
