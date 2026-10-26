import type { HorizonNote } from '@reinforce/server/dto';
import { chartSeriesVars } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { corridor } from '../domain/corridor-vm';

const COLOR = chartSeriesVars[0];

export function Corridor({ horizon }: { readonly horizon: Pick<HorizonNote, 'q10' | 'expected' | 'q90'> }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const c = corridor(horizon);
  const lo = fmt.change(horizon.q10, 2);
  const hi = fmt.change(horizon.q90, 2);
  const expected = fmt.change(horizon.expected, 2);
  return (
    <div className="flex flex-col gap-1.5">
      <div role="img" aria-label={t('data.corridor', { expected, lo, hi })} className="relative h-9">
        <span
          style={{ left: `${c.mid}%` }}
          className={cn(
            'absolute top-0 whitespace-nowrap font-figure text-foreground text-xs',
            match(c.anchor)
              .with('start', () => '')
              .with('middle', () => '-translate-x-1/2')
              .with('end', () => '-translate-x-full')
              .exhaustive(),
          )}
        >
          {t('data.expects', { change: expected })}
        </span>
        <span className="absolute inset-x-0 top-7 h-px bg-foreground/10" />
        <span
          style={{ left: `${c.lo}%`, width: `${c.hi - c.lo}%`, backgroundColor: COLOR }}
          className="motion-safe:fade-in absolute top-[1.5625rem] h-1.5 rounded-full opacity-30 motion-safe:animate-in motion-safe:duration-500"
        />
        <span
          style={{ left: `${c.start}%` }}
          className="absolute top-5.5 h-3 w-px -translate-x-1/2 bg-foreground/50"
        />
        <span
          style={{ left: `${c.mid}%`, backgroundColor: COLOR }}
          className="absolute top-6 size-2 -translate-x-1/2 rounded-full"
        />
      </div>
      <div aria-hidden className="relative h-4 font-figure text-muted-foreground text-xs">
        <span style={{ left: `${c.lo}%` }} className="absolute top-0">
          {lo}
        </span>
        <span style={{ right: `${100 - c.hi}%` }} className="absolute top-0">
          {hi}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">{t('data.corridorNote')}</p>
    </div>
  );
}
