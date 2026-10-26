import type { Chats } from '@reinforce/server/dto';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, MessageCircle } from 'lucide-react';
import { type ReactNode, useId, useRef } from 'react';
import { match } from 'ts-pattern';
import {
  groupTopics,
  searchTopics,
  type Topic,
  type TopicPosition,
  topicsOf,
  visitingMarket,
} from '~/contexts/conversation/domain/topics';
import { useTopicPreview } from '~/contexts/conversation/ui/use-topic-preview';
import { useTopicTitle } from '~/contexts/conversation/ui/use-topic-title';
import { useServerNow } from '~/shared/api/live';
import { useSession } from '~/shared/api/session';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFlip } from '~/shared/hooks/use-flip';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { BrandMark } from '~/shared/ui/brand-mark';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { UnreadBadge } from '~/shared/ui/unread-badge';
import { railFadeClass, railLabelClass, railRowClass, railSlotClass, unreadDotClass } from './rail';
import { RailTip } from './rail-tip';

const DIRECTION_CLASS = { up: 'text-up', down: 'text-down', flat: 'text-muted-foreground' } as const;

const TWIN_WIDTHS = ['w-28', 'w-20', 'w-32', 'w-24'] as const;

export function TopicsPanel({
  expanded,
  active,
  onNavigate,
}: {
  readonly expanded: boolean;
  readonly active: string | null;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  const chats = useQuery(trpc.views.chats.queryOptions());
  return (
    <section aria-label={t('topics.label')} className="mt-3 flex flex-col border-foreground/7 border-t">
      <div className="px-3 pt-1 pb-3">
        {expanded ? (
          <AsyncView query={chats} errorTitle={t('topics.failed')} loading={<TopicsTwin expanded />}>
            {(data) => (
              <TopicGroups
                chats={data}
                active={active}
                query=""
                expanded={expanded}
                onNavigate={onNavigate}
              />
            )}
          </AsyncView>
        ) : (
          <RailTopics active={active} onNavigate={onNavigate} />
        )}
      </div>
    </section>
  );
}

function RailTopics({
  active,
  onNavigate,
}: {
  readonly active: string | null;
  readonly onNavigate?: () => void;
}) {
  const chats = useQuery(trpc.views.chats.queryOptions());
  if (chats.data)
    return (
      <TopicGroups chats={chats.data} active={active} query="" expanded={false} onNavigate={onNavigate} />
    );
  if (chats.isError) return null;
  return <TopicsTwin expanded={false} />;
}

function TopicGroups({
  chats,
  active,
  query,
  expanded,
  onNavigate,
}: {
  readonly chats: Chats;
  readonly active: string | null;
  readonly query: string;
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  const titleOf = useTopicTitle();
  const now = useServerNow(60_000);
  const instruments = useSession().data?.market.instruments ?? [];
  const list = useRef<HTMLDivElement>(null);
  useFlip(list);
  const topics = searchTopics(topicsOf(chats, visitingMarket(active, instruments)), query, (topic) => [
    titleOf(topic),
    topic.market?.ticker ?? '',
  ]);
  if (topics.length === 0)
    return <p className="px-3 py-3 text-muted-foreground text-sm">{t('topics.none')}</p>;
  return (
    <div ref={list} className="flex flex-col">
      {groupTopics(topics, now).map((group) => (
        <TopicDayGroup key={group.day} day={group.day} label={t(`days.${group.day}`)} expanded={expanded}>
          {group.topics.map((topic) => (
            <li key={topic.key} data-flip={topic.key} className="flex">
              <TopicRow
                topic={topic}
                current={topic.key === active}
                expanded={expanded}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </TopicDayGroup>
      ))}
    </div>
  );
}

function TopicDayGroup({
  day,
  label,
  expanded,
  children,
}: {
  readonly day: string;
  readonly label: string;
  readonly expanded: boolean;
  readonly children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col">
      <span
        id={id}
        data-flip={`day-${day}`}
        className={cn(
          railFadeClass(expanded),
          'truncate px-3 font-medium text-muted-foreground text-xs',
          expanded ? 'pt-3 pb-1' : 'h-3 overflow-hidden',
        )}
      >
        {label}
      </span>
      <ul aria-labelledby={id} className="flex flex-col gap-0.5">
        {children}
      </ul>
    </div>
  );
}

function TopicRow({
  topic,
  current,
  expanded,
  onNavigate,
}: {
  readonly topic: Topic;
  readonly current: boolean;
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  const titleOf = useTopicTitle();
  const previewOf = useTopicPreview();
  const title = titleOf(topic);
  const preview = previewOf(topic.row);
  const queryClient = useQueryClient();
  const unread = current ? 0 : topic.unread;
  const prefetch = () => {
    void queryClient.prefetchQuery(trpc.views.chat.queryOptions({ topic: topic.key }));
  };
  return (
    <RailTip label={title} enabled={!expanded}>
      <Link
        {...topicLink(topic.key)}
        activeOptions={{ exact: true, includeSearch: false }}
        title={expanded && preview !== '' ? preview : undefined}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onClick={onNavigate}
        className={railRowClass(expanded)}
      >
        <span className={railSlotClass(expanded)}>
          <span className="relative flex">
            <TopicGlyph topic={topic} />
            {unread > 0 && <span aria-hidden className={cn(unreadDotClass, railFadeClass(!expanded))} />}
          </span>
        </span>
        <span className={railLabelClass(expanded)}>{title}</span>
        {topic.position && <PositionMark position={topic.position} expanded={expanded} />}
        <UnreadBadge
          count={unread}
          label={t('topics.unread', { count: unread })}
          className={cn(railFadeClass(expanded), 'ms-1.5')}
        />
      </Link>
    </RailTip>
  );
}

export function TopicGlyph({ topic }: { readonly topic: Topic }) {
  return match(topic)
    .with({ kind: 'general' }, () => <BrandMark className="size-5 text-foreground-soft" />)
    .with({ kind: 'talk' }, () => (
      <MessageCircle
        strokeWidth={1.75}
        className="size-4.5 text-muted-foreground group-hover/row:text-foreground"
      />
    ))
    .with({ kind: 'market' }, ({ market }) =>
      market ? <CoinLogo coin={market.coin} ticker={market.ticker} size="sm" /> : null,
    )
    .exhaustive();
}

function PositionMark({
  position,
  expanded,
}: {
  readonly position: TopicPosition;
  readonly expanded: boolean;
}) {
  const { t } = useT('shell');
  const Arrow = position.side === 'LONG' ? ArrowUpRight : ArrowDownRight;
  const tone = position.pnl === null ? 'flat' : directionOf(position.pnl, 2);
  return (
    <span className={cn(railFadeClass(expanded), 'ms-1.5 flex shrink-0')}>
      <Arrow aria-hidden strokeWidth={2} className={cn('size-3.5', DIRECTION_CLASS[tone])} />
      <span className="sr-only">{t(`topics.position.${position.side}`)}</span>
    </span>
  );
}

function TopicsTwin({ expanded }: { readonly expanded: boolean }) {
  return (
    <div aria-hidden className="flex flex-col gap-0.5">
      <span className={cn('px-3 pt-3 pb-1 text-xs', !expanded && 'invisible h-3 pt-0 pb-0')}>
        <Skeleton className="h-3 w-16 rounded-full" />
      </span>
      {TWIN_WIDTHS.map((width) => (
        <div key={width} className={railRowClass(expanded)}>
          <span className={railSlotClass(expanded)}>
            <Skeleton className="size-5 rounded-full" />
          </span>
          {expanded && <Skeleton className={cn('h-3 rounded-full', width)} />}
        </div>
      ))}
    </div>
  );
}
