import {
  type InlineNoteAlign,
  type InlineNoteSize,
  type InlineNoteTone,
  inlineNoteBodyClass,
  inlineNoteContentVariants,
  inlineNoteTextVariants,
  inlineNoteTitleClass,
  inlineNoteVariants,
} from '@reinforce/ui-primitives/inline-note';
import { cn } from '@reinforce/ui-styles/cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type { InlineNoteAlign, InlineNoteSize, InlineNoteTone };

export function InlineNote({
  tone = 'warning',
  size = 'default',
  align = 'start',
  icon: Icon,
  title,
  role,
  children,
  className,
}: {
  readonly tone?: InlineNoteTone;
  readonly size?: InlineNoteSize;
  readonly align?: InlineNoteAlign;
  readonly icon?: LucideIcon;
  readonly title?: string;
  readonly role?: 'status' | 'alert';
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      data-slot="inline-note"
      data-variant={tone}
      role={role}
      className={cn(inlineNoteVariants({ tone, size, align }), className)}
    >
      {Icon && <Icon strokeWidth={2} />}
      {title === undefined ? (
        <span className={inlineNoteTextVariants({ size, align })}>{children}</span>
      ) : (
        <span className={inlineNoteContentVariants({ align })}>
          <span className={inlineNoteTitleClass}>{title}</span>
          <span className={inlineNoteBodyClass}>{children}</span>
        </span>
      )}
    </div>
  );
}
