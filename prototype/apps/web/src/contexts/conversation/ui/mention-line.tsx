import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import type { MentionItem } from '../domain/chat-types';

export function MentionLine({ mention }: { readonly mention: MentionItem }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const idea = mention.idea;
  const what = idea
    ? match(idea.side)
        .with('LONG', () => t('feed.idea.LONG', { amount: f.usd(idea.sizeUsd) }))
        .with('SHORT', () => t('feed.idea.SHORT', { amount: f.usd(idea.sizeUsd) }))
        .exhaustive()
    : mention.text;
  const state = match(idea?.status ?? 'open')
    .with('open', () => f.clock(mention.at))
    .with('confirmed', () => t('feed.idea.confirmed'))
    .with('skipped', () => t('feed.idea.skipped'))
    .with('expired', () => t('feed.idea.expired'))
    .with('superseded', () => t('feed.idea.superseded'))
    .exhaustive();
  return (
    <Link
      {...topicLink(mention.chat)}
      className="glass focus-ring flex w-full max-w-[40rem] items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-foreground/5"
    >
      <CoinLogo coin={mention.coin} ticker={mention.ticker} size="sm" />
      <span className="shrink-0 font-semibold">{mention.name}</span>
      {what && <span className="min-w-0 truncate text-muted-foreground">{what}</span>}
      <span className="ms-auto shrink-0 font-figure text-muted-foreground text-xs">{state}</span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
