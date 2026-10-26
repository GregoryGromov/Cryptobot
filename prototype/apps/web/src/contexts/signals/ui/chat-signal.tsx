import type { SignalView } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { Zap } from 'lucide-react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { lifeMinutes, type SignalLife, signalLife } from '../domain/signal-life';
import { SignalLifeTimer } from './signal-life';
import { SignalSpark } from './signal-spark';
import { factsWords, signalDirectionClass } from './signal-words';

const IDLE_TICK_MS = 30_000;
const LIFE_TICK_MS = 1_000;

export function ChatSignal({ signal }: { readonly signal: SignalView }) {
  const idle = useServerNow(IDLE_TICK_MS);
  return idle < signal.staleAt ? (
    <LivingSignal signal={signal} />
  ) : (
    <SignalCard signal={signal} life={null} />
  );
}

function LivingSignal({ signal }: { readonly signal: SignalView }) {
  return <SignalCard signal={signal} life={signalLife(signal, useServerNow(LIFE_TICK_MS))} />;
}

function SignalCard({ signal, life }: { readonly signal: SignalView; readonly life: SignalLife | null }) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const fresh = life !== null;
  return (
    <section
      aria-label={t('label')}
      className={cn(
        cardVariants({ size: 'sm' }),
        'flex-row items-center gap-3 px-4 py-3 transition-opacity duration-500 motion-reduce:transition-none',
        !fresh && 'opacity-50',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'relative flex size-8.5 shrink-0 items-center justify-center rounded-full bg-foreground/5 ring-1 ring-foreground/12 ring-inset',
          signalDirectionClass(signal.direction),
        )}
      >
        <Zap className="size-4" strokeWidth={2} />
        {fresh && (
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-current ring-2 ring-card motion-safe:animate-pulse" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium text-foreground text-row">
          <Trans
            t={t}
            i18nKey="line"
            values={{
              head: t(`move.${signal.direction}`),
              change: fmt.move(signal.move),
              horizon: horizonWords(format, signal.horizon),
            }}
            components={{
              move: <span className={cn('font-figure', signalDirectionClass(signal.direction))} />,
            }}
          />
        </p>
        <p className="text-meta text-muted-foreground">
          {[t('at', { time: fmt.clock(signal.eventAt) }), ...factsWords(signal, t, format)].join(' · ')}
          {' · '}
          {life ? <SignalLifeTimer life={life} minutes={lifeMinutes(signal)} /> : t('stale')}
        </p>
      </div>
      {signal.spark && <SignalSpark spark={signal.spark} direction={signal.direction} dim={!fresh} />}
    </section>
  );
}
