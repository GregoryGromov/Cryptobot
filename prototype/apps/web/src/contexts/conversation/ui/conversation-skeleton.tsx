import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { type ReactNode, useRef } from 'react';
import { useFlight } from '~/shared/hooks/use-arrival';
import { useT } from '~/shared/i18n';
import { columnClass } from './feed-classes';

function ComposerTwin({ placeholder, pick }: { readonly placeholder: string; readonly pick: boolean }) {
  const { t } = useT('conversation');
  const glass = useRef<HTMLDivElement>(null);
  useFlight(glass, 'composer');
  return (
    <div
      ref={glass}
      aria-hidden
      className="glass-strong glass-lift flex flex-col gap-1 rounded-[1.375rem] p-2"
    >
      <p className="px-3 py-2 text-base text-muted-foreground">{placeholder}</p>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="px-3 font-semibold text-[0.8125rem] text-muted-foreground">
          {pick && t('composer.pick')}
        </span>
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  );
}

const BUBBLES = [
  { key: 'broker-1', className: 'h-20 w-[78%] rounded-bl-md' },
  { key: 'user-1', className: 'mt-8 h-11 w-[46%] self-end rounded-br-md' },
  { key: 'broker-2', className: 'mt-6 h-16 w-[64%] rounded-bl-md' },
  { key: 'card', className: 'mt-6 h-44 w-full' },
] as const;

export function FeedSkeleton() {
  const { t } = useT('common');
  return (
    <div role="status" aria-busy="true" className={cn(columnClass, 'flex-1 px-4 pt-4 pb-6')}>
      <span className="sr-only">{t('loading')}</span>
      {BUBBLES.map((bubble) => (
        <Skeleton key={bubble.key} className={cn('rounded-2xl', bubble.className)} />
      ))}
    </div>
  );
}

export function ConversationSkeleton({
  feed = null,
  placeholder,
  pick = true,
}: {
  readonly feed?: ReactNode;
  readonly placeholder?: string;
  /** Whether the composer offers to pick a market: not in a market's own conversation. */
  readonly pick?: boolean;
}) {
  const { t } = useT('conversation');
  return (
    <>
      {feed ?? <FeedSkeleton />}
      <div className="sticky bottom-0 pb-3">
        <div className={cn(columnClass, 'px-3')}>
          <ComposerTwin placeholder={placeholder ?? t('composer.placeholder.none')} pick={pick} />
        </div>
      </div>
    </>
  );
}
