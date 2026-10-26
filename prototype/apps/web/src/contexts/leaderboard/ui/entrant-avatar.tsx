import { cn } from '@reinforce/ui-styles/cn';
import { useT } from '~/shared/i18n';
import type { Entrant } from '../domain/demo-standings';

const SIZE = { sm: 'size-5 text-[0.5625rem]', md: 'size-8 text-xs' } as const;

export function EntrantAvatar({
  entrant,
  size = 'md',
}: {
  readonly entrant: Entrant;
  readonly size?: keyof typeof SIZE;
}) {
  const { t } = useT('leaderboard');
  const letter = (entrant.handle ?? t('list.you')).charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-foreground/9 font-semibold ring-1 ring-inset',
        SIZE[size],
        entrant.handle === null
          ? 'text-foreground ring-foreground/40'
          : 'text-foreground-soft ring-foreground/8',
      )}
    >
      {letter}
    </span>
  );
}

export function useEntrantName(): (entrant: Entrant) => string {
  const { t } = useT('leaderboard');
  return (entrant) =>
    entrant.handle === null ? t('list.you') : t('list.handle', { handle: entrant.handle });
}
