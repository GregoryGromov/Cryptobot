import { Tooltip, TooltipContent, TooltipTrigger } from '@reinforce/ui-react/tooltip';
import type { ReactNode } from 'react';

export function RailTip({
  label,
  enabled,
  children,
}: {
  readonly label: string;
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  if (!enabled) return children;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
