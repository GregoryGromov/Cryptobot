import type { SignalRow } from '@reinforce/server/dto';
import type { ReactNode } from 'react';
import { agoWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { isFresh, type Wave, wavesOf } from '../domain/waves';
import { SignalLine } from './signal-line';
import { timesWords, withWords } from './signal-words';

const NOW_TICK_MS = 30_000;

export function SignalRows({
  items,
  onOpen,
  quiet,
  limit,
}: {
  readonly items: readonly SignalRow[];
  readonly onOpen: (signal: SignalRow) => void;
  readonly quiet?: ReactNode;
  readonly limit?: number;
}) {
  const now = useServerNow(NOW_TICK_MS);
  const waves = wavesOf(items).slice(0, limit ?? items.length);
  if (waves.length === 0) return quiet ?? null;
  return (
    <ul className="flex flex-col">
      {waves.map((wave) => (
        <li key={wave.key} className="[&+&]:border-foreground/7 [&+&]:border-t">
          <WaveLine wave={wave} now={now} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function WaveLine({
  wave,
  now,
  onOpen,
}: {
  readonly wave: Wave;
  readonly now: number;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { lead } = wave;
  const meta = [
    wave.with.length ? withWords(wave.with, t) : timesWords(lead, t),
    agoWords(format, fmt.duration, lead.eventAt, now),
    lead.asked ? t('asked') : null,
  ].filter((part) => part !== null);
  return <SignalLine signal={lead} fresh={isFresh(wave, now)} meta={meta.join(' · ')} onOpen={onOpen} />;
}
