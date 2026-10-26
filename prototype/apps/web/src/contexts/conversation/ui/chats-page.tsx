import { sectionCardClass } from '@reinforce/ui-primitives/card';
import {
  listRowCopyClass,
  listRowDiscVariants,
  listRowFigureClass,
  listRowGroupLabelClass,
  listRowMetaVariants,
  listRowTitleVariants,
  listRowVariants,
} from '@reinforce/ui-primitives/list-row';
import { Input } from '@reinforce/ui-react/input';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { calendarDayOf } from '~/shared/format/time';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { BrandMark } from '~/shared/ui/brand-mark';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { personalColumnClass } from '~/shared/ui/page-column';
import { UnreadBadge } from '~/shared/ui/unread-badge';
import { groupTopics, searchTopics, type Topic, topicsOf } from '../domain/topics';
import { useTopicPreview } from './use-topic-preview';
import { useTopicTitle } from './use-topic-title';

const NOW_TICK_MS = 60_000;
const TWIN_ROWS = ['a', 'b', 'c', 'd', 'e'] as const;

function TopicDisc({ topic }: { readonly topic: Topic }) {
  if (topic.market) return <CoinLogo coin={topic.market.coin} ticker={topic.market.ticker} size="lg" />;
  return (
    <span className={listRowDiscVariants()}>
      {match(topic.kind)
        .with('general', () => <BrandMark className="size-5" />)
        .with('talk', 'market', () => <MessageCircle aria-hidden />)
        .exhaustive()}
    </span>
  );
}

function TopicLine({ topic, now }: { readonly topic: Topic; readonly now: number }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const titleOf = useTopicTitle();
  const previewOf = useTopicPreview();
  const preview = previewOf(topic.row);
  const today = calendarDayOf(topic.at, now) === 'today';
  const pnl = topic.position?.pnl ?? null;
  return (
    <li>
      <Link
        {...topicLink(topic.key)}
        className={cn(
          listRowVariants({ trail: true }),
          'focus-ring hover-neutral-soft -mx-3 rounded-xl px-3',
        )}
      >
        <TopicDisc topic={topic} />
        <span className={listRowCopyClass}>
          <span className={listRowTitleVariants()}>{titleOf(topic)}</span>
          <span className={listRowMetaVariants()}>{preview === '' ? t('chats.preview.none') : preview}</span>
        </span>
        <span className={cn(listRowFigureClass, 'flex flex-col items-end gap-1')}>
          {topic.at > 0 && (
            <span className="font-figure text-muted-foreground text-xs">
              {today ? f.clock(topic.at) : f.day(topic.at)}
            </span>
          )}
          <UnreadBadge count={topic.unread} label={t('topics.unread', { count: topic.unread })} />
          {pnl !== null && (
            <Numeral tone="direction" direction={directionOf(pnl, 2)} size="xs">
              <span className="sr-only">{t('chats.position')} </span>
              {f.usdSigned(pnl)}
            </Numeral>
          )}
        </span>
        <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
      </Link>
    </li>
  );
}

function ChatsList({ topics, query }: { readonly topics: readonly Topic[]; readonly query: string }) {
  const { t } = useT('conversation');
  const titleOf = useTopicTitle();
  const previewOf = useTopicPreview();
  const now = useServerNow(NOW_TICK_MS);
  const found = searchTopics(topics, query, (topic) => [
    titleOf(topic),
    topic.market?.ticker ?? '',
    previewOf(topic.row),
  ]);
  if (found.length === 0) return <Text variant="muted">{t('chats.nothing')}</Text>;
  return (
    <div className={cn(sectionCardClass, 'flex flex-col gap-1 px-5 pt-3 pb-3')}>
      {groupTopics(found, now).map((group) => (
        <section key={group.day} aria-label={t(`days.${group.day}`)}>
          <h2 className={listRowGroupLabelClass}>{t(`days.${group.day}`)}</h2>
          <ul>
            {group.topics.map((topic) => (
              <TopicLine key={topic.key} topic={topic} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ChatsTwin() {
  const { t } = useT('common');
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(sectionCardClass, 'flex flex-col gap-4 px-5 pt-4 pb-4')}
    >
      <span className="sr-only">{t('loading')}</span>
      {TWIN_ROWS.map((row) => (
        <div key={row} className="flex items-center gap-3.5">
          <Skeleton className="size-9 rounded-full" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChatsPage() {
  const { t } = useT('conversation');
  const chats = useQuery(trpc.views.chats.queryOptions());
  const [query, setQuery] = useState('');
  return (
    <div className={personalColumnClass}>
      <Heading as="h1" size="page">
        {chats.data || chats.isError ? t('chats.title') : <SkeletonLines>{t('chats.title')}</SkeletonLines>}
      </Heading>
      <Input
        type="search"
        aria-label={t('chats.search')}
        placeholder={t('chats.search')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <AsyncView query={chats} errorTitle={t('chats.error')} loading={<ChatsTwin />}>
        {(data) => {
          const topics = topicsOf(data, null);
          return (
            <>
              <ChatsList topics={topics} query={query} />
              {topics.length <= 1 && !query && <Text variant="muted">{t('chats.empty')}</Text>}
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
