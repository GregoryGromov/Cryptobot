import { cn } from '@reinforce/ui-styles/cn';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';

const MEDALS = [
  'bg-accent/12 text-accent ring-accent/35',
  'bg-foreground/6 text-foreground-soft ring-foreground/22',
  'bg-warning/12 text-warning ring-warning/35',
] as const;

export function RankMark({ rank, mine = false }: { readonly rank: number; readonly mine?: boolean }) {
  const { t } = useT('leaderboard');
  const medal = MEDALS[rank - 1];
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full font-figure text-sm',
        medal !== undefined && cn('font-semibold ring-1 ring-inset', medal),
        medal === undefined && (mine ? 'font-semibold text-foreground' : 'text-muted-foreground'),
      )}
    >
      <span aria-hidden>{rank}</span>
      <span className="sr-only">{t('list.rank', { rank })}</span>
    </span>
  );
}

export function RankDelta({ delta, className }: { readonly delta: number; readonly className?: string }) {
  const { t } = useT('leaderboard');
  const fmt = useFormatters();
  const label =
    delta > 0
      ? t('list.up', { count: delta })
      : delta < 0
        ? t('list.down', { count: -delta })
        : t('list.still');
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-0.5 font-figure text-meta',
        delta > 0 ? 'text-up' : 'text-muted-foreground',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" strokeWidth={2} />
      {delta !== 0 && <span aria-hidden>{fmt.int(Math.abs(delta))}</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}
