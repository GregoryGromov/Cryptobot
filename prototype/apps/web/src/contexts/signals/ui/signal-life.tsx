import type { SignalView } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { useServerNow } from '~/shared/api/live';
import { useT } from '~/shared/i18n';
import { lifeMinutes, type SignalLife, signalLife } from '../domain/signal-life';

const RADIUS = 5.5;
const ROUND = 2 * Math.PI * RADIUS;
const LIFE_TICK_MS = 1_000;

export function SignalLifeTimer({ life, minutes }: { readonly life: SignalLife; readonly minutes: number }) {
  const { t } = useT('signals');
  return (
    <span
      role="timer"
      title={t('life.hint', { minutes })}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap align-bottom font-figure',
        life.soon ? 'text-warning' : 'text-foreground-soft',
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
        <circle cx="7" cy="7" r={RADIUS} fill="none" strokeWidth="2" className="stroke-foreground/15" />
        <circle
          cx="7"
          cy="7"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={ROUND}
          strokeDashoffset={ROUND * (1 - life.share)}
          transform="rotate(-90 7 7)"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>
      {t('life.left', { clock: life.clock })}
    </span>
  );
}

export function TickingLife({ signal }: { readonly signal: Pick<SignalView, 'eventAt' | 'staleAt'> }) {
  const { t } = useT('signals');
  const life = signalLife(signal, useServerNow(LIFE_TICK_MS));
  return life ? <SignalLifeTimer life={life} minutes={lifeMinutes(signal)} /> : t('stale');
}
