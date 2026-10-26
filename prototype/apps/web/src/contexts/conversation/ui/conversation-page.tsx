import type { Quote } from '@reinforce/server/dto';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '~/shared/api/trpc';
import { useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { useOutbox } from '../api/outbox-store';
import { ConversationHead, type HeadState } from './conversation-head';
import { ConversationSkeleton } from './conversation-skeleton';
import { ConversationView } from './conversation-view';
import { pageClass } from './feed-classes';
import { OutboxFeed } from './outbox-feed';

const loadingHead = (topic: string, market: Quote | null): HeadState =>
  market ? { kind: 'market', market, position: null, trade: false } : { kind: 'loading', topic };

export function ConversationPage({
  topic,
  idea = null,
}: {
  readonly topic: string;
  readonly idea?: string | null;
}) {
  const { t } = useT('conversation');
  const locale = useLocale();
  const chat = useQuery(trpc.views.chat.queryOptions({ topic }));
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const outbox = useOutbox(topic);
  if (chat.data)
    return (
      <AppBoundary tier="section" scope="conversation">
        <ConversationView chat={chat.data} idea={idea} />
      </AppBoundary>
    );
  const market = catalog.data?.flatMap((group) => group.markets).find((quote) => quote.key === topic) ?? null;
  return (
    <div className={pageClass}>
      <ConversationHead state={loadingHead(topic, market)} />
      <AsyncView
        query={chat}
        errorTitle={t('errors.chat')}
        loading={
          <ConversationSkeleton
            placeholder={
              market
                ? t('composer.placeholder.market', { name: inSentence(market.name, locale) })
                : t('composer.placeholder.none')
            }
            pick={market === null}
            feed={outbox.length > 0 ? <OutboxFeed outbox={outbox} market={market} /> : null}
          />
        }
      >
        {() => null}
      </AsyncView>
    </div>
  );
}
