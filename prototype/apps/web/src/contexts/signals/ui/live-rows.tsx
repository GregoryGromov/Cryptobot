import type { SignalRow } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { agoWords, horizonWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { moveDigits } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { type Wave, wavesOf } from '../domain/waves';
import { SignalSpark } from './signal-spark';
import { signalDirectionClass, timesWords, withNamesWords } from './signal-words';

const LIVE_SHOWN = 3;
const NOW_TICK_MS = 30_000;
const MINUTE_MS = 60_000;

export function LiveRows({
  items,
  onOpen,
  quiet,
}: {
  readonly items: readonly SignalRow[];
  readonly onOpen: (signal: SignalRow) => void;
  readonly quiet?: ReactNode;
}) {
  const now = useServerNow(NOW_TICK_MS);
  const waves = wavesOf(items).slice(0, LIVE_SHOWN);
  if (waves.length === 0) return quiet ?? null;
  return (
    <ul className="@container flex flex-col gap-1.5 max-sm:-mx-2">
      {waves.map((wave, index) => (
        <li key={wave.key}>
          <LiveRow wave={wave} now={now} latest={index === 0} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function LiveRow({
  wave,
  now,
  latest,
  onOpen,
}: {
  readonly wave: Wave;
  readonly now: number;
  readonly latest: boolean;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { lead } = wave;
  const age = now - lead.eventAt;
  const ago = agoWords(format, fmt.duration, lead.eventAt, now);
  return (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      className="focus-ring flex min-h-12.5 w-full items-center gap-3 rounded-(--radius) bg-foreground/4 py-2.5 ps-2.5 pe-3 text-left font-medium text-foreground text-row transition-colors hover:bg-foreground/8 active:bg-foreground/10 max-sm:pe-2.5"
    >
      <CoinLogo coin={lead.coin} ticker={lead.ticker} size="sm" className="size-5.5" />
      <span className="min-w-0 flex-1">
        <span className="block @2xl:truncate">
          <Trans
            t={t}
            i18nKey={`live.${lead.direction}`}
            values={{
              name: lead.name,
              move: fmt.percent(Math.abs(lead.move), moveDigits(lead.move)),
              horizon: horizonWords(format, lead.horizon).replaceAll(' ', '\u00A0'),
              times: timesWords(lead, t),
            }}
            components={{
              b: <b className="font-semibold" />,
              move: <span className={cn('font-figure', signalDirectionClass(lead.direction))} />,
              more: <span className="@max-2xl:hidden" />,
            }}
          />
        </span>
        {wave.with.length > 0 && (
          <span className="mt-px block @2xl:truncate font-normal text-meta text-muted-foreground first-letter:uppercase">
            {withNamesWords(wave.with, t)}
          </span>
        )}
      </span>
      {lead.spark && (
        <span className="@max-2xl:hidden">
          <SignalSpark spark={lead.spark} direction={lead.direction} size="line" plain decorative />
        </span>
      )}
      <span className="flex @2xl:min-w-24 shrink-0 items-center justify-end whitespace-nowrap font-figure font-normal text-meta text-muted-foreground">
        {latest && (
          <span
            aria-hidden
            className="me-2 size-2 rounded-full bg-up ring-[3px] ring-up/20 motion-safe:animate-[status-dot-pulse_2.6s_ease-in-out_infinite]"
          />
        )}
        <span className="@max-2xl:hidden">{ago}</span>
        <span className="@2xl:hidden">{age < MINUTE_MS ? ago : fmt.duration(age)}</span>
      </span>
    </button>
  );
}
