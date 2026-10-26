import { match, P } from 'ts-pattern';

export const GENERAL_TOPIC = 'broker';

const TALK_PREFIX = 'talk-';

export type TopicKind =
  | { readonly kind: 'general' }
  | { readonly kind: 'talk'; readonly talk: string }
  | { readonly kind: 'market'; readonly market: string };

export const topicKind = (topic: string): TopicKind => {
  if (topic === GENERAL_TOPIC) return { kind: 'general' };
  if (topic.startsWith(TALK_PREFIX)) return { kind: 'talk', talk: topic.slice(TALK_PREFIX.length) };
  return { kind: 'market', market: topic };
};

export const talkTopic = (talk: string): string => `${TALK_PREFIX}${talk}`;

export type TopicLink =
  | { readonly to: '/c' }
  | { readonly to: '/c/$talk'; readonly params: { readonly talk: string } }
  | { readonly to: '/m/$market'; readonly params: { readonly market: string } };

export const topicLink = (topic: string): TopicLink =>
  match(topicKind(topic))
    .with({ kind: 'general' }, (): TopicLink => ({ to: '/c' }))
    .with({ kind: 'talk', talk: P.select() }, (talk): TopicLink => ({ to: '/c/$talk', params: { talk } }))
    .with(
      { kind: 'market', market: P.select() },
      (market): TopicLink => ({ to: '/m/$market', params: { market } }),
    )
    .exhaustive();

export const assetCode = (ticker: string): string => `$${ticker.toUpperCase()}`;

export const tickerOf = (coin: string): string => coin.replace(/^.*:/, '');
