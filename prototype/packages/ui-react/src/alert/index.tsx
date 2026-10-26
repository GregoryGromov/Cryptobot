import {
  type AlertVariants,
  alertDescriptionClass,
  alertTitleClass,
  alertVariants,
} from '@reinforce/ui-primitives/alert';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & AlertVariants) {
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn(alertTitleClass, className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn(alertDescriptionClass, className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
