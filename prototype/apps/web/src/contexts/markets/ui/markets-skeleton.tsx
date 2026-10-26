import { listRowVariants } from '@reinforce/ui-primitives/list-row';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { HourStoriesSkeleton } from './hour-stories';
import { marketRowGridClass } from './market-row';
import { MarketTable } from './markets-board';

const ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function MarketsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <HourStoriesSkeleton />
      <Skeleton className="h-11 w-96 max-w-full" />
      <MarketTable>
        {ROWS.map((row) => (
          <li key={row} className={cn(listRowVariants(), marketRowGridClass)}>
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <span className="flex flex-col items-end gap-1.5 sm:contents">
              <Skeleton className="h-4 w-16 sm:justify-self-end" />
              <Skeleton className="h-3 w-10 sm:h-4 sm:w-12 sm:justify-self-end" />
            </span>
            <Skeleton className="hidden h-7 w-22 justify-self-center sm:block" />
            <Skeleton className="size-8 justify-self-center rounded-full" />
          </li>
        ))}
      </MarketTable>
    </div>
  );
}
