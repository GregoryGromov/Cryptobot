import {
  type StatusDotState,
  type StatusDotVariants,
  statusDotVariants,
} from '@reinforce/ui-primitives/status-dot';
import { cn } from '@reinforce/ui-styles/cn';
import { Check, X } from 'lucide-react';
import type * as React from 'react';

// Shape is the primary channel (forced-colors / colour-blind safe); colour is the redundant second channel.
const ring = <span className="size-full rounded-full border-2 border-current" aria-hidden />;
const filled = <span className="size-full rounded-full bg-current" aria-hidden />;
const SHAPE: Record<StatusDotState, React.ReactNode> = {
  working: ring,
  'needs-you': filled,
  attention: filled,
  done: <Check strokeWidth={3.5} aria-hidden />,
  failed: <X strokeWidth={3.5} aria-hidden />,
};

function StatusDot({
  className,
  state,
  label,
  size = 'default',
  pulse = false,
  ...props
}: Omit<React.ComponentProps<'span'>, 'aria-label' | 'children'> &
  Omit<StatusDotVariants, 'state'> & {
    readonly state: StatusDotState;
    readonly label: string;
  }) {
  return (
    <span
      data-slot="status-dot"
      data-state={state}
      role="img"
      aria-label={label}
      className={cn(statusDotVariants({ state, size, pulse }), className)}
      {...props}
    >
      {SHAPE[state]}
    </span>
  );
}

export { StatusDot };
