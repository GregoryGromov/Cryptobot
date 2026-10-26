import type { SignalView } from '@reinforce/server/dto';
import { Tooltip, TooltipContent, TooltipTrigger } from '@reinforce/ui-react/tooltip';
import { Zap } from 'lucide-react';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { horizonWords } from '../domain/verdict';

/** The signal's mark on the chart, over its candle: a lightning in glass that tells the signal when pointed at. */
export function SignalPin({ signal }: { readonly signal: SignalView }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const { t: words } = useT('signals');
  const fmt = useFormatters();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t('signal.chart.pin', { time: fmt.clock(signal.eventAt) })}
          className="pointer-events-auto grid size-7 -translate-x-1/2 -translate-y-[calc(100%+0.375rem)] place-items-center rounded-full bg-popover text-warning shadow-sm ring-1 ring-foreground/10 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 motion-reduce:transition-none"
        >
          <Zap aria-hidden className="size-3.5 fill-current" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 font-semibold text-warning">
          <Zap aria-hidden className="size-3 fill-current" strokeWidth={2} />
          {t('signal.source')}
          <span className="font-figure font-normal text-muted-foreground">· {fmt.clock(signal.eventAt)}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <Numeral tone="direction" direction={directionOf(signal.move, 2)} weight="semibold">
            {fmt.move(signal.move)}
          </Numeral>
          <span className="text-muted-foreground">
            {t('signal.move', {
              head: words(`head.${signal.direction}`),
              horizon: horizonWords(format, signal.horizon),
            })}
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
