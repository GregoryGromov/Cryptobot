import type { MarketName } from '@reinforce/server/dto';
import { listRowVariants } from '@reinforce/ui-primitives/list-row';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Check, Clock, type LucideIcon, Minus, X } from 'lucide-react';
import type { CheckMark, JournalCheck, JournalRow } from '~/contexts/broker/domain/journal-vm';
import { checkWords, forecastCheckWords, horizonWords, leanWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';

const LEAN_TONE = { up: 'text-up', down: 'text-down', flat: 'text-foreground' } as const;

const MARKS: Record<CheckMark, { readonly Icon: LucideIcon; readonly tone: string; readonly disc: string }> =
  {
    hit: { Icon: Check, tone: 'text-success', disc: 'bg-success/14' },
    miss: { Icon: X, tone: 'text-destructive', disc: 'bg-destructive/14' },
    'no-lean': { Icon: Minus, tone: 'text-muted-foreground', disc: '' },
    waiting: { Icon: Clock, tone: 'text-muted-foreground', disc: '' },
    'no-prices': { Icon: Minus, tone: 'text-muted-foreground', disc: '' },
    'not-scored': { Icon: Minus, tone: 'text-muted-foreground', disc: '' },
  };

const CLOCK_MS = 30_000;

export const journalRowGridClass =
  'grid-cols-[1.75rem_minmax(0,1fr)_auto_auto] gap-x-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_8.5rem_13rem_3.5rem]';

export function JournalItem({
  row,
  market,
  several,
}: {
  readonly row: JournalRow;
  readonly market: MarketName | undefined;
  readonly several: boolean;
}) {
  const { t } = useT('broker');
  const { t: tf } = useT('format');
  const { dateTime } = useFormatters();
  const name = market?.name ?? row.coin;
  const ticker = market?.ticker ?? row.coin;
  return (
    <li
      className={cn(
        listRowVariants(),
        journalRowGridClass,
        'hover-neutral-soft relative -mx-2 rounded-md px-2',
      )}
    >
      <CoinLogo coin={row.coin} ticker={ticker} className="self-center" />
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          {row.threadId === null ? (
            <span className="truncate font-medium text-foreground text-row">{name}</span>
          ) : (
            <Link
              {...topicLink(row.coin)}
              search={{ idea: row.threadId }}
              className="focus-ring truncate rounded-sm font-medium text-foreground text-row after:absolute after:inset-0"
            >
              {name}
            </Link>
          )}
          {!row.scored && (
            <span className="shrink-0 whitespace-nowrap rounded-full border border-foreground/14 px-2 py-px text-muted-foreground text-xs">
              {t('journal.offRecord')}
            </span>
          )}
          {several && row.version !== null && (
            <span className="shrink-0 text-meta text-muted-foreground">
              {t('journal.versionN', { n: row.version })}
            </span>
          )}
        </span>
        <span className="text-meta text-muted-foreground sm:hidden">{dateTime(row.at)}</span>
      </span>
      <span className="hidden whitespace-nowrap text-meta text-muted-foreground sm:block">
        {dateTime(row.at)}
      </span>
      <span
        className={cn(
          'justify-self-end whitespace-nowrap font-medium text-meta sm:justify-self-start sm:text-sm',
          LEAN_TONE[row.tone],
        )}
      >
        {leanWords(tf, row.probs)}
        <span className="sr-only">{horizonWords(tf, row.horizon)}</span>
      </span>
      <span className="flex justify-self-center">
        <CheckChip check={row.check} />
      </span>
    </li>
  );
}

function CheckChip({ check }: { readonly check: JournalCheck }) {
  const { t } = useT('broker');
  const { t: tf } = useT('format');
  const { duration } = useFormatters();
  const now = useServerNow(CLOCK_MS);
  const { Icon, tone, disc } = MARKS[check.mark];
  const verdict =
    check.status === 'resolved'
      ? checkWords(tf, check.lean, check.outcome)
      : forecastCheckWords(tf, duration, check, now);
  return (
    <span
      role="img"
      aria-label={t('journal.mark', { horizon: horizonWords(tf, check.horizon), verdict })}
      className={cn('inline-flex size-6.5 items-center justify-center rounded-full', disc)}
    >
      <Icon aria-hidden className={cn('size-3.5 sm:size-4', tone)} strokeWidth={2.25} />
    </span>
  );
}
