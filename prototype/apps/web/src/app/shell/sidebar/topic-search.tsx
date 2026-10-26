import type { SearchHit } from '@reinforce/server/dto';
import { commandInputClass } from '@reinforce/ui-primitives/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@reinforce/ui-react/dialog';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useGoToTopic } from '~/contexts/conversation/api/navigation';
import { searchTopics, type Topic, topicsOf } from '~/contexts/conversation/domain/topics';
import { useTopicTitle } from '~/contexts/conversation/ui/use-topic-title';
import { trpc } from '~/shared/api/trpc';
import { useDebounced } from '~/shared/hooks/use-debounced';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { TopicGlyph } from './topics-panel';

const TWIN_WIDTHS = ['w-40', 'w-28', 'w-48', 'w-32', 'w-36'] as const;

const SEARCH_FROM = 2;
const SEARCH_DELAY_MS = 250;

const rowClass =
  'focus-ring hover-neutral-soft flex items-center gap-3 rounded-md px-3 text-foreground text-row transition-colors';

const labelClass = 'px-3 pt-2 pb-1.5 text-meta text-muted-foreground';

const latestFirst = (topics: readonly Topic[]): readonly Topic[] => [...topics].sort((a, b) => b.at - a.at);

export function TopicSearch({
  className,
  onNavigate,
}: {
  readonly className?: string;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT(['shell', 'common']);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={t('topics.search')}
        onClick={() => setOpen(true)}
        className={cn(
          'focus-ring hover-neutral-soft inline-flex size-8 items-center justify-center rounded-md text-muted-foreground',
          className,
        )}
      >
        <Search strokeWidth={1.9} className="size-[1.0625rem]" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="lg"
          closeButton={{ label: t('common:close') }}
          className="flex h-[min(32rem,calc(100dvh-4rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[42rem] [&>[data-slot=dialog-close]]:top-4.5 [&>[data-slot=dialog-close]]:right-5"
        >
          <DialogTitle className="sr-only">{t('topics.search')}</DialogTitle>
          <DialogDescription className="sr-only">{t('topics.searchHint')}</DialogDescription>
          <SearchBody
            onDone={() => {
              setOpen(false);
              onNavigate?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchBody({ onDone }: { readonly onDone: () => void }) {
  const { t } = useT('shell');
  const chats = useQuery(trpc.views.chats.queryOptions());
  const titleOf = useTopicTitle();
  const goToTopic = useGoToTopic();
  const [query, setQuery] = useState('');
  const needle = useDebounced(query.trim(), SEARCH_DELAY_MS);
  const searching = needle.length >= SEARCH_FROM;
  const found = useQuery(
    trpc.views.search.queryOptions(
      { query: needle },
      { enabled: searching, placeholderData: keepPreviousData, meta: { silent: true } },
    ),
  );
  const all = chats.data ? latestFirst(topicsOf(chats.data, null)) : [];
  const topics = searchTopics(all, query, (topic) => [titleOf(topic), topic.market?.ticker ?? '']);
  const hits = searching && query.trim() !== '' ? (found.data ?? []) : [];
  const answered = (found.data !== undefined && !found.isPlaceholderData) || found.isError;
  const settled = query.trim() === needle && (!searching || answered);
  const firstKey = topics[0]?.key ?? hits[0]?.topic;
  return (
    <>
      <div className="shrink-0 border-border border-b py-4 ps-5 pe-14">
        <input
          type="text"
          enterKeyHint="search"
          aria-label={t('topics.search')}
          autoComplete="off"
          spellCheck={false}
          className={cn(commandInputClass, 'w-full text-base')}
          placeholder={t('topics.search')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || firstKey === undefined) return;
            event.preventDefault();
            onDone();
            void goToTopic(firstKey);
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        <AsyncView query={chats} errorTitle={t('topics.failed')} loading={<SearchTwin />}>
          {() => (
            <>
              {query.trim() === '' && <p className={labelClass}>{t('topics.recent')}</p>}
              {topics.length === 0 && hits.length === 0 && settled && (
                <p className={labelClass}>{t('topics.nothing')}</p>
              )}
              <ul className="flex flex-col gap-0.5">
                {topics.map((topic) => (
                  <li key={topic.key}>
                    <Link {...topicLink(topic.key)} onClick={onDone} className={cn(rowClass, 'h-11')}>
                      <span className="flex w-6 shrink-0 justify-center">
                        <TopicGlyph topic={topic} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{titleOf(topic)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {hits.length > 0 && (
                <section aria-label={t('topics.inTalks')}>
                  <p className={cn(labelClass, topics.length > 0 && 'pt-4')}>{t('topics.inTalks')}</p>
                  <ul className="flex flex-col gap-0.5">
                    {hits.map((hit) => (
                      <li key={hit.id}>
                        <FoundLine
                          hit={hit}
                          topic={all.find((topic) => topic.key === hit.topic)}
                          onDone={onDone}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </AsyncView>
      </div>
    </>
  );
}

function FoundLine({
  hit,
  topic,
  onDone,
}: {
  readonly hit: SearchHit;
  readonly topic: Topic | undefined;
  readonly onDone: () => void;
}) {
  const titleOf = useTopicTitle();
  const end = hit.start + hit.length;
  return (
    <Link {...topicLink(hit.topic)} onClick={onDone} className={cn(rowClass, 'py-2')}>
      <span className="flex w-6 shrink-0 justify-center">{topic && <TopicGlyph topic={topic} />}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate">{topic ? titleOf(topic) : hit.topic}</span>
        <span className="truncate text-meta text-muted-foreground">
          {hit.text.slice(0, hit.start)}
          <mark className="bg-transparent font-medium text-foreground">{hit.text.slice(hit.start, end)}</mark>
          {hit.text.slice(end)}
        </span>
      </span>
    </Link>
  );
}

function SearchTwin() {
  return (
    <div aria-hidden className="flex flex-col gap-0.5 pt-9">
      {TWIN_WIDTHS.map((width) => (
        <div key={width} className="flex h-11 items-center gap-3 px-3">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className={cn('h-3.5 rounded-full', width)} />
        </div>
      ))}
    </div>
  );
}
