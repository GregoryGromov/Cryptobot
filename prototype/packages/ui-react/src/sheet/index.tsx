'use client';

import {
  sheetCloseClass,
  sheetContentVariants,
  sheetDescriptionClass,
  sheetOverlayClass,
  sheetTitleClass,
} from '@reinforce/ui-primitives/sheet';
import { cn } from '@reinforce/ui-styles/cn';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import type * as React from 'react';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(sheetOverlayClass, className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  closeButton,
  withOverlay = true,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  closeButton: false | { readonly label: string };
  withOverlay?: boolean;
  overlayClassName?: string;
}) {
  return (
    <SheetPortal>
      {withOverlay && <SheetOverlay className={overlayClassName} />}
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetContentVariants({ side }), className)}
        {...props}
      >
        {children}
        {closeButton !== false && (
          <SheetPrimitive.Close data-slot="sheet-close" className={sheetCloseClass}>
            <XIcon className="size-4" strokeWidth={1.75} />
            <span className="sr-only">{closeButton.label}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title data-slot="sheet-title" className={cn(sheetTitleClass, className)} {...props} />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(sheetDescriptionClass, className)}
      {...props}
    />
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle };
