import type { SignalRow } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';
import { sinceOf, type Wave, wavesOf } from '../domain/waves';
import { SignalSpark } from './signal-spark';
import { signalDirectionClass, timesWords } from './signal-words';

const CHIPS = 6;
const CURRENT = 3;
const SHOWN = 30;
const JUST_NOW_MS = 60_000;

export const timelineGridClass =
  'grid grid-cols-[3rem_0.5625rem_minmax(0,1fr)] gap-x-2.5 sm:grid-cols-[4.625rem_0.5625rem_minmax(0,1fr)] sm:gap-x-3.5';

const titleWords = (signal: SignalRow, t: TFunction<'signals'>): string => {
  const head = t(`feed.head.${signal.direction}`);
  return match(signal.scope)
    .with('IDIOSYNCRATIC', 'BROAD', 'MARKET_WIDE', (scope) => t(`feed.scoped.${scope}`, { head }))
    .with('UNKNOWN', () => head)
    .exhaustive();
};

export function SignalTimeline({
  items,
  now,
  onOpen,
}: {
  readonly items: readonly SignalRow[];
  readonly now: number;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const waves = wavesOf(items).slice(0, SHOWN);
  return (
    <ol aria-label={t('page.timeline')} className="flex flex-col">
      {waves.map((wave, index) => (
        <WaveEntry
          key={wave.key}
          wave={wave}
          now={now}
          latest={index === 0}
          last={index === waves.length - 1}
          stale={index >= CURRENT}
          onOpen={onOpen}
        />
      ))}
    </ol>
  );
}

function WaveEntry({
  wave,
  now,
  latest,
  last,
  stale,
  onOpen,
}: {
  readonly wave: Wave;
  readonly now: number;
  readonly latest: boolean;
  readonly last: boolean;
  readonly stale: boolean;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { lead } = wave;
  const dim = stale && 'opacity-25';
  return (
    <li className={timelineGridClass}>
      <span
        className={cn(
          'flex h-7.5 items-center justify-end text-right font-figure text-meta text-muted-foreground sm:whitespace-nowrap',
          dim,
        )}
      >
        {now - lead.eventAt < JUST_NOW_MS ? format('ago.now') : fmt.duration(now - lead.eventAt)}
      </span>
      <span aria-hidden className="relative flex justify-center">
        {!latest && <span className="absolute top-0 h-1.75 w-px bg-foreground/15" />}
        {!last && <span className="absolute top-5.75 bottom-0 w-px bg-foreground/15" />}
        <span className={cn('flex h-7.5 items-center', signalDirectionClass(lead.direction), dim)}>
          <span className="relative size-2.25 rounded-full bg-current">
            {latest && (
              <span className="absolute -inset-1 rounded-full bg-current/30 blur-[2px] motion-safe:animate-[status-dot-pulse_2.6s_ease-in-out_infinite]" />
            )}
          </span>
        </span>
      </span>
      <div className={cn('flex min-w-0 flex-col gap-1', last ? 'pb-6' : 'pb-14', dim)}>
        {stale ? (
          <div className="flex items-center gap-7">
            <WaveWords signal={lead} now={now} linked />
          </div>
        ) : (
          <button
            type="button"
            title={lead.asked ? t('openReading') : t('analyze')}
            onClick={() => onOpen(lead)}
            className="focus-ring hover-neutral-soft -mx-2 -my-1.5 flex items-center gap-7 rounded-md px-2 py-1.5 text-left transition-colors"
          >
            <WaveWords signal={lead} now={now} />
          </button>
        )}
        {wave.with.length > 0 && <WaveMembers wave={wave} stale={stale} onOpen={onOpen} />}
      </div>
    </li>
  );
}

function WaveWords({
  signal,
  now,
  linked = false,
}: {
  readonly signal: SignalRow;
  readonly now: number;
  readonly linked?: boolean;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const since = sinceOf(signal, now);
  const marketClass = 'flex min-w-0 items-center gap-2 text-foreground text-row';
  const market = (
    <>
      <CoinLogo coin={signal.coin} ticker={signal.ticker} size="sm" />
      <span className="truncate font-semibold">{signal.name}</span>
    </>
  );
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-h-7.5 items-center gap-3">
          {linked ? (
            <Link
              {...topicLink(signal.chat)}
              title={t('feed.topic', { name: signal.name })}
              className={cn(marketClass, 'focus-ring rounded-md')}
            >
              {market}
            </Link>
          ) : (
            <span className={marketClass}>{market}</span>
          )}
          <span className="shrink-0 whitespace-nowrap text-meta text-muted-foreground">
            <span
              className={cn(
                'me-1.5 font-figure font-semibold text-row',
                signalDirectionClass(signal.direction),
              )}
            >
              {fmt.move(signal.move)}
            </span>{' '}
            {t('over', { horizon: horizonWords(format, signal.horizon) })}
          </span>
        </span>
        <span className="text-meta text-muted-foreground">
          {[titleWords(signal, t), timesWords(signal, t)].join(' · ')}
          {signal.volumeConfirmed && `, ${t('volume')}`}
          {since !== null && (
            <>
              {' · '}
              <Trans
                t={t}
                i18nKey="since"
                values={{ change: fmt.change(since, 2) }}
                components={{
                  move: (
                    <span
                      className={cn('font-figure font-semibold', directionClass(directionOf(since, 2)))}
                    />
                  ),
                }}
              />
            </>
          )}
        </span>
      </span>
      {signal.spark && (
        <span className="hidden sm:block">
          <SignalSpark spark={signal.spark} direction={signal.direction} size="line" plain />
        </span>
      )}
    </>
  );
}

function WaveMembers({
  wave,
  stale,
  onOpen,
}: {
  readonly wave: Wave;
  readonly stale: boolean;
  readonly onOpen: (signal: SignalRow) => void;
}) {
  const { t } = useT('signals');
  const fmt = useFormatters();
  const [all, setAll] = useState(false);
  const shown = all ? wave.with : wave.with.slice(0, CHIPS);
  const chip = (member: SignalRow) => (
    <>
      <CoinLogo coin={member.coin} ticker={member.ticker} size="sm" />
      {member.name}
      <span className={cn('font-figure font-semibold', signalDirectionClass(member.direction))}>
        {fmt.move(member.move)}
      </span>
    </>
  );
  return (
    <div className="mt-1.5 flex flex-col gap-2">
      <span className="text-meta text-muted-foreground/80">
        {t('feed.with', { count: wave.with.length })}
      </span>
      <ul aria-label={t('withLabel')} className="flex flex-wrap gap-1.5">
        {shown.map((member) => (
          <li key={member.eventId}>
            {stale ? (
              <Button asChild variant="secondary" size="sm" className="ps-1.5">
                <Link {...topicLink(member.chat)}>{chip(member)}</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="ps-1.5" onClick={() => onOpen(member)}>
                {chip(member)}
              </Button>
            )}
          </li>
        ))}
        {wave.with.length > CHIPS && (
          <li>
            <Button variant="ghost" size="sm" aria-expanded={all} onClick={() => setAll(!all)}>
              {all ? t('chips.less') : t('chips.more', { count: wave.with.length - CHIPS })}
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
}
