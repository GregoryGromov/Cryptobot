import { cn } from '@reinforce/ui-styles/cn';
import type { Tint } from '~/shared/api/mock/agents';

export const tintDotClass: Record<Tint, string> = {
  violet: 'bg-(--palette-violet-500)',
  blue: 'bg-(--palette-blue-500)',
  emerald: 'bg-(--palette-emerald-500)',
  amber: 'bg-(--palette-amber-500)',
  neutral: 'bg-(--palette-neutral-500)',
};

type Slice = { readonly label: string; readonly share: number; readonly tint: Tint };

export function Slices({
  slices,
  legend = true,
  className,
}: {
  readonly slices: readonly Slice[];
  readonly legend?: boolean;
  readonly className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div
        role="img"
        aria-label={slices.map((slice) => `${slice.label} ${slice.share}%`).join(', ')}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
      >
        {slices.map((slice) => (
          <span key={slice.label} className={tintDotClass[slice.tint]} style={{ flexGrow: slice.share }} />
        ))}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-muted-foreground">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center gap-1.5">
              <span aria-hidden className={cn('size-2 rounded-full', tintDotClass[slice.tint])} />
              <span className="text-foreground-soft">{slice.label}</span>
              <span className="tabular-nums">{slice.share}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
