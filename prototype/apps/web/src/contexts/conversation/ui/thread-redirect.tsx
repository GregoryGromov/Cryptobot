import { useQuery } from '@tanstack/react-query';
import { Navigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { topicKind } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { ConversationHead } from './conversation-head';
import { FeedSkeleton } from './conversation-skeleton';
import { pageClass } from './feed-classes';

function ToTopic({ topic, idea }: { readonly topic: string; readonly idea: string }) {
  return match(topicKind(topic))
    .with({ kind: 'general' }, () => <Navigate to="/c" replace />)
    .with({ kind: 'talk' }, ({ talk }) => <Navigate to="/c/$talk" params={{ talk }} replace />)
    .with({ kind: 'market' }, ({ market }) => (
      <Navigate to="/m/$market" params={{ market }} search={{ idea }} replace />
    ))
    .exhaustive();
}

export function ThreadRedirect({ id }: { readonly id: string }) {
  const { t } = useT('conversation');
  const thread = useQuery(trpc.views.thread.queryOptions(id, { meta: { silent: true } }));
  return (
    <div className={pageClass}>
      <ConversationHead state={{ kind: 'blank' }} />
      <AsyncView query={thread} errorTitle={t('errors.thread')} loading={<FeedSkeleton />}>
        {(data) => <ToTopic topic={data.chat} idea={id} />}
      </AsyncView>
    </div>
  );
}
