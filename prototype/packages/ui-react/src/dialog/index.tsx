import {
  type DialogContentVariants,
  dialogCloseClass,
  dialogContentVariants,
  dialogDescriptionClass,
  dialogHeaderClass,
  dialogOverlayClass,
  dialogTitleClass,
} from '@reinforce/ui-primitives/dialog';
import { cn } from '@reinforce/ui-styles/cn';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(dialogOverlayClass, className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  size = 'default',
  closeButton,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  DialogContentVariants & {
    readonly closeButton: false | { readonly label: string };
  }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-size={size}
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
        {closeButton !== false && (
          <DialogPrimitive.Close data-slot="dialog-close" className={dialogCloseClass}>
            <XIcon strokeWidth={1.75} />
            <span className="sr-only">{closeButton.label}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn(dialogHeaderClass, className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title data-slot="dialog-title" className={cn(dialogTitleClass, className)} {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(dialogDescriptionClass, className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle };
