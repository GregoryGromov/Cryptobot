import type { Cls, Probs } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { probabilityOf, tenthsOf } from '../domain/verdict';

const TICK_STEP_MS = 35;
const OUTCOMES = ['UP', 'FLAT', 'DOWN'] as const;

const tickClass = (cls: Cls, lead: boolean): string =>
  match(cls)
    .with('UP', () => (lead ? 'bg-up shadow-[0_0_8px_-2px] shadow-up/60' : 'bg-up/45'))
    .with('DOWN', () => (lead ? 'bg-down shadow-[0_0_8px_-2px] shadow-down/60' : 'bg-down/45'))
    .with('FLAT', () => 'bg-foreground/16')
    .exhaustive();

/** Ten ticks shared out among the three outcomes, the leading one first. */
export function LeanTicks({ probs, lead }: { readonly probs: Probs; readonly lead: Cls }) {
  const order = [
    lead,
    ...OUTCOMES.filter((cls) => cls !== lead && cls === 'FLAT'),
    ...OUTCOMES.filter((cls) => cls !== lead && cls !== 'FLAT'),
  ];
  const ticks = order.flatMap((cls) =>
    Array.from({ length: tenthsOf(probabilityOf(probs, cls)) }, (_, i) => ({ key: `${cls}-${i}`, cls })),
  );
  return (
    <span aria-hidden className="flex items-center gap-0.75">
      {ticks.slice(0, 10).map((tick, place) => (
        <span
          key={tick.key}
          style={{ animationDelay: `${place * TICK_STEP_MS}ms` }}
          className={cn(
            'motion-safe:fade-in motion-safe:zoom-in-50 h-4 w-1.5 rounded-[3px] fill-mode-both motion-safe:animate-in motion-safe:duration-300',
            tickClass(tick.cls, tick.cls === lead),
          )}
        />
      ))}
    </span>
  );
}
