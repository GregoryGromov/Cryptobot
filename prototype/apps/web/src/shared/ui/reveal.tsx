import { cn } from '@reinforce/ui-styles/cn';
import { type ReactNode, useState } from 'react';

export function Reveal({
  open,
  id,
  className,
  children,
}: {
  readonly open: boolean;
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const [kept, setKept] = useState(open);
  if (open && !kept) setKept(true);
  return (
    <div
      id={id}
      data-open={open}
      inert={!open}
      className={cn(
        'grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out data-[open=true]:grid-rows-[1fr] motion-reduce:transition-none',
        className,
      )}
    >
      <div className="-mx-1 min-h-0 overflow-hidden px-1">{kept && children}</div>
    </div>
  );
}
