import { match } from 'ts-pattern';
import { agentOfTopic } from '~/shared/api/mock/agents';
import { useT } from '~/shared/i18n';
import type { Topic } from '../domain/topics';

export function useTopicTitle(): (topic: Topic) => string {
  const { t } = useT('conversation');
  return (topic) =>
    agentOfTopic(topic.key)?.name ??
    match(topic.kind)
      .with('general', () => t('head.general'))
      .with('talk', () => topic.title ?? t('head.newTalk'))
      .with('market', () => topic.market?.name ?? topic.title ?? topic.key)
      .exhaustive();
}
