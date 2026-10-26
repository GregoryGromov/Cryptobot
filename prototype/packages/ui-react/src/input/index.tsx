import { type InputVariants, inputVariants } from '@reinforce/ui-primitives/input';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<'input'>, 'size'> & InputVariants) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size ?? 'default'}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input };
