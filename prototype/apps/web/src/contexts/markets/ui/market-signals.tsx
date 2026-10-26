import type { SignalRow } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import type { ListedMarket } from '~/contexts/markets/domain/market-list-vm';
import { useOpenSignal } from '~/contexts/signals/api/use-open-signal';
import { sinceOf } from '~/contexts/signals/domain/waves';
import { signalDirectionClass } from '~/contexts/signals/ui/signal-words';
import { useServerNow } from '~/shared/api/live';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { directionClass } from '~/shared/ui/direction-class';
import { PANEL_HEAD_CLASS, PANEL_TITLE_CLASS } from './terminal-layout';

const NOW_TICK_MS = 30_000;
const PHONE_SHOWN = 5;
const JUST_NOW_MS = 60_000;

const lineGridClass = 'grid grid-cols-[4.5rem_0.5625rem_minmax(0,1fr)] gap-x-2.5';

export function MarketSignals({
  market,
  signals,
}: {
  readonly market: ListedMarket;
  readonly signals: readonly SignalRow[];
}) {
  const { t } = useT('markets');
  const id = useId();
  const open = useOpenSignal();
  const now = useServerNow(NOW_TICK_MS);
  return (
    <section aria-labelledby={id} className="flex min-h-0 flex-col gap-3 lg:flex-1">
      <div className={PANEL_HEAD_CLASS}>
        <h2 id={id} className={PANEL_TITLE_CLASS}>
          {t('signals.title')}
        </h2>
        <span className="text-meta text-muted-foreground">{market.ticker}</span>
      </div>
      {signals.length === 0 ? (
        <p className="pb-1 text-meta text-muted-foreground">{t('signals.none')}</p>
      ) : (
        <ol className="flex flex-col pt-1 lg:min-h-0 lg:flex-1 lg:flex-wrap lg:overflow-hidden">
          {signals.map((signal, index) => (
            <SignalLine
              key={signal.eventId}
              signal={signal}
              now={now}
              latest={index === 0}
              last={index === signals.length - 1}
              phone={index < PHONE_SHOWN}
              onOpen={open}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function SignalLine({
  signal,
  now,
  latest,
  last,
  phone,
  onOpen,
}: {
  readonly signal: SignalRow;
  readonly now: number;
  readonly latest: boolean;
  readonly last: boolean;
  readonly phone: boolean;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const f = useFormatters();
  const since = sinceOf(signal, now);
  const stale = signal.staleAt <= now;
  const dim = stale && 'opacity-25';
  return (
    <li className={cn(lineGridClass, 'w-full', !phone && 'max-lg:hidden')}>
      <span
        className={cn(
          'flex h-7 items-center justify-end whitespace-nowrap font-figure text-meta text-muted-foreground',
          dim,
        )}
      >
        {now - signal.eventAt < JUST_NOW_MS ? format('ago.now') : f.duration(now - signal.eventAt)}
      </span>
      <span aria-hidden className="relative flex justify-center">
        {!latest && <span className="absolute top-0 h-1.5 w-px bg-foreground/15" />}
        {!last && <span className="absolute top-5.5 bottom-0 w-px bg-foreground/15" />}
        <span className={cn('flex h-7 items-center', signalDirectionClass(signal.direction), dim)}>
          <span className="relative size-2.25 rounded-full bg-current">
            {latest && !stale && (
              <span className="absolute -inset-1 rounded-full bg-current/30 blur-[2px] motion-safe:animate-[status-dot-pulse_2.6s_ease-in-out_infinite]" />
            )}
          </span>
        </span>
      </span>
      <button
        type="button"
        title={signal.asked ? t('openReading') : t('analyze')}
        onClick={() => onOpen(signal)}
        className={cn(
          'focus-ring hover-neutral-soft -mx-2 mb-3 flex min-w-0 flex-col rounded-md px-2 py-0.5 text-left transition-colors',
          last && 'mb-1',
          dim,
        )}
      >
        <span className="flex min-h-6 items-baseline gap-1.5 whitespace-nowrap text-meta text-muted-foreground">
          <span className={cn('font-figure font-semibold text-row', signalDirectionClass(signal.direction))}>
            {f.move(signal.move)}
          </span>
          {t('over', { horizon: horizonWords(format, signal.horizon) })}
        </span>
        {since !== null && (
          <span className="text-meta text-muted-foreground">
            <Trans
              t={t}
              i18nKey="since"
              values={{ change: f.change(since, 2) }}
              components={{
                move: (
                  <span className={cn('font-figure font-semibold', directionClass(directionOf(since, 2)))} />
                ),
              }}
            />
          </span>
        )}
      </button>
    </li>
  );
}
