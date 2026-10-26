import { cn } from '@reinforce/ui-styles/cn';

export function UnreadBadge({
  count,
  label,
  className,
}: {
  readonly count: number;
  readonly label: string;
  readonly className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 font-figure font-semibold text-[0.6875rem] text-primary-foreground',
        className,
      )}
    >
      <span aria-hidden>{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
