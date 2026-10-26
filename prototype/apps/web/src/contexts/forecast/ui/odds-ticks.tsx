import type { Cls } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useT } from '~/shared/i18n';
import type { OutcomeColumn } from '../domain/horizon-vm';

const TICK_STEP_MS = 35;

const tickClass = (cls: Cls): string =>
  match(cls)
    .with('DOWN', () => 'bg-down')
    .with('FLAT', () => 'bg-foreground/40')
    .with('UP', () => 'bg-up')
    .exhaustive();

export function OddsTicks({
  outcomes,
  label,
  flat,
}: {
  readonly outcomes: readonly OutcomeColumn[];
  readonly label: string;
  readonly flat: string;
}) {
  const { t } = useT('forecast');
  return (
    <ul aria-label={label} className="flex gap-1 pt-2.5">
      {outcomes.map((outcome, place) => {
        const before = outcomes.slice(0, place).reduce((sum, o) => sum + o.tenths, 0);
        return (
          <li
            key={outcome.cls}
            style={{ flexGrow: outcome.tenths }}
            className={cn(
              'relative flex min-w-0 basis-0 flex-col gap-1.5',
              outcome.tenths === 0 && 'sr-only',
            )}
          >
            {outcome.landed && (
              <span
                aria-hidden
                className="absolute -top-2.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-foreground"
              />
            )}
            <span aria-hidden className={cn('flex gap-0.5', !outcome.lead && 'opacity-45')}>
              {Array.from({ length: outcome.tenths }, (_, i) => i).map((i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${(before + i) * TICK_STEP_MS}ms` }}
                  className={cn(
                    'motion-safe:fade-in motion-safe:zoom-in-50 h-1.5 flex-1 rounded-full fill-mode-both motion-safe:animate-in motion-safe:duration-300',
                    tickClass(outcome.cls),
                  )}
                />
              ))}
            </span>
            <span
              title={outcome.cls === 'FLAT' ? flat : undefined}
              className={cn(
                'whitespace-nowrap text-xs',
                outcome.lead ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(`horizon.short.${outcome.cls}`)}
              <span className="sr-only">
                {` ${t('lean.tenths', { n: outcome.tenths })}`}
                {outcome.landed && `, ${t('horizon.landed')}`}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
