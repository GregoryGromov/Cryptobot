import { type TextareaVariants, textareaVariants } from '@reinforce/ui-primitives/textarea';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

function Textarea({
  className,
  size,
  ...props
}: Omit<React.ComponentProps<'textarea'>, 'size'> & TextareaVariants) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size ?? 'default'}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea };
