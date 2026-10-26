import { cn } from '@reinforce/ui-styles/cn';
import { Crown } from 'lucide-react';

export function PremiumBadge({ className }: { readonly className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-(--palette-violet-500) to-(--palette-blue-500) px-2 py-0.5 font-semibold text-[0.6875rem] text-white shadow-sm',
        className,
      )}
    >
      <Crown aria-hidden strokeWidth={2.2} className="size-3" />
      Premium
    </span>
  );
}
