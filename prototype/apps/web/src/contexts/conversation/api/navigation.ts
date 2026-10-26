import { useNavigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { topicKind } from '~/shared/routing/topics';

export type TopicVisit = {
  readonly idea?: string | null;
  readonly replace?: boolean;
};

export function useGoToTopic(): (topic: string, visit?: TopicVisit) => Promise<void> {
  const navigate = useNavigate();
  return (topic, visit = {}) => {
    const replace = visit.replace ?? false;
    return match(topicKind(topic))
      .with({ kind: 'general' }, () => navigate({ to: '/c', replace }))
      .with({ kind: 'talk' }, ({ talk }) => navigate({ to: '/c/$talk', params: { talk }, replace }))
      .with({ kind: 'market' }, ({ market }) =>
        navigate({
          to: '/m/$market',
          params: { market },
          search: visit.idea ? { idea: visit.idea } : {},
          replace,
        }),
      )
      .exhaustive();
  };
}
