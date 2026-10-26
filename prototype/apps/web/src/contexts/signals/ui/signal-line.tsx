import type { SignalRow } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { SignalSpark } from './signal-spark';
import { signalDirectionClass } from './signal-words';

export function SignalLine({
  signal,
  fresh,
  meta,
  onOpen,
}: {
  readonly signal: SignalRow;
  readonly fresh: boolean;
  readonly meta: ReactNode;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  return (
    <button
      type="button"
      onClick={() => onOpen(signal)}
      className="@container focus-ring hover-neutral-soft grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-1.5 py-2.5 text-left transition-colors"
    >
      <CoinLogo coin={signal.coin} ticker={signal.ticker} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'flex min-w-0 items-baseline gap-1.5 text-row',
            fresh ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="max-w-[55%] shrink-0 truncate font-medium">{signal.name}</span>
          <span className={cn('shrink-0 font-figure font-medium', signalDirectionClass(signal.direction))}>
            {fmt.move(signal.move)}
          </span>
          <span className="min-w-0 truncate text-meta text-muted-foreground">
            {t('over', { horizon: horizonWords(format, signal.horizon) })}
          </span>
        </span>
        <span className="truncate text-meta text-muted-foreground">{meta}</span>
      </span>
      <span className="@max-[18rem]:hidden">
        {signal.spark && (
          <SignalSpark spark={signal.spark} direction={signal.direction} dim={!fresh} decorative />
        )}
      </span>
    </button>
  );
}
