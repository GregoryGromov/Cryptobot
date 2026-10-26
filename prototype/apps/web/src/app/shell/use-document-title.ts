import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { match, P } from 'ts-pattern';
import { useSession } from '~/shared/api/session';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { topicKind } from '~/shared/routing/topics';
import type { ShellRoute } from './domain/shell-route';

export function useDocumentTitle(route: ShellRoute): void {
  const { t } = useT(['shell', 'common', 'conversation']);
  const talks = useQuery(trpc.views.chats.queryOptions()).data?.talks ?? [];
  const instruments = useSession().data?.market.instruments ?? [];
  const page = match(route)
    .with({ kind: P.union('home', 'other') }, () => null)
    .with({ kind: 'section' }, ({ section }) => t(`common:nav.${section}`))
    .with({ kind: 'topic' }, ({ topic }) =>
      match(topicKind(topic))
        .with({ kind: 'general' }, () => t('conversation:head.general'))
        .with(
          { kind: 'talk' },
          () => talks.find((talk) => talk.key === topic)?.title ?? t('common:nav.chats'),
        )
        .with(
          { kind: 'market' },
          ({ market }) => instruments.find((instrument) => instrument.coin === market)?.name ?? market,
        )
        .exhaustive(),
    )
    .exhaustive();
  const title = page === null ? t('common:title') : t('title', { page });
  useEffect(() => {
    document.title = title;
  }, [title]);
}
