import type { Figure } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { tickerOf } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';
import { compareBars } from '../../domain/figure-vm';

export function CompareFigure({ figure }: { readonly figure: Extract<Figure, { kind: 'compare' }> }) {
  const fmt = useFormatters();
  return (
    <ul className="flex flex-col gap-1.5">
      {compareBars(figure).map((bar) => {
        const tone = directionClass(directionOf(bar.value, 2));
        return (
          <li
            key={bar.label}
            className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_4.5rem] items-center gap-2.5 text-xs"
          >
            <span
              className={cn(
                'flex min-w-0 items-center gap-1.5 truncate',
                bar.own ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {bar.coin && <CoinLogo coin={bar.coin} ticker={tickerOf(bar.coin)} size="sm" />}
              <span className="truncate">{tickerOf(bar.label)}</span>
            </span>
            <span className="relative h-2 rounded-full bg-foreground/6">
              <span
                className={cn('absolute inset-y-0 rounded-full bg-current', tone)}
                style={
                  bar.value >= 0
                    ? { left: '50%', width: `${bar.share}%` }
                    : { right: '50%', width: `${bar.share}%` }
                }
              />
              <span className="absolute inset-y-[-2px] left-1/2 w-px bg-foreground/25" />
            </span>
            <span className={cn('text-end font-figure', tone, bar.own && 'font-semibold')}>
              {fmt.change(bar.value, 2)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
