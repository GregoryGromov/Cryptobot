import type { ChatRow, Chats, MarketName, Side } from '@reinforce/server/dto';
import { calendarDayOf } from '~/shared/format/time';

const TOPIC_DAYS = ['today', 'yesterday', 'earlier', 'new'] as const;

export type TopicDay = (typeof TOPIC_DAYS)[number];

export type TopicPosition = { readonly side: Side; readonly pnl: number | null };

export type Topic = {
  readonly key: string;
  readonly kind: 'general' | 'talk' | 'market';
  readonly title: string | null;
  readonly market: MarketName | null;
  readonly at: number;
  readonly unread: number;
  readonly position: TopicPosition | null;
  readonly row: ChatRow;
};

export type TopicGroup = { readonly day: TopicDay; readonly topics: readonly Topic[] };

const nameOf = (market: MarketName): MarketName => ({
  coin: market.coin,
  name: market.name,
  ticker: market.ticker,
  cls: market.cls,
});

export const visitingMarket = (topic: string | null, instruments: readonly MarketName[]): MarketName | null =>
  instruments.find((instrument) => instrument.coin === topic) ?? null;

const visitorOf = (chats: Chats, visiting: MarketName | null): readonly Topic[] => {
  if (visiting === null || chats.markets.some((row) => row.key === visiting.coin)) return [];
  return [
    {
      key: visiting.coin,
      kind: 'market',
      title: visiting.name,
      market: nameOf(visiting),
      at: 0,
      unread: 0,
      position: null,
      row: { key: visiting.coin, preview: null, at: 0, unread: 0, spoken: false },
    },
  ];
};

export const topicsOf = (chats: Chats, visiting: MarketName | null): readonly Topic[] => {
  const general: Topic = {
    key: chats.broker.key,
    kind: 'general',
    title: null,
    market: null,
    at: chats.broker.at,
    unread: chats.broker.unread,
    position: null,
    row: chats.broker,
  };
  const talks = chats.talks.map(
    (row): Topic => ({
      key: row.key,
      kind: 'talk',
      title: row.title,
      market: null,
      at: row.at,
      unread: row.unread,
      position: null,
      row,
    }),
  );
  const markets = chats.markets.map(
    (row): Topic => ({
      key: row.key,
      kind: 'market',
      title: row.name,
      market: nameOf(row),
      at: row.at,
      unread: row.unread,
      position: row.position,
      row,
    }),
  );
  return [general, ...talks, ...visitorOf(chats, visiting), ...markets].sort((a, b) => b.at - a.at);
};

const fold = (text: string): string => text.toLocaleLowerCase().normalize('NFKD');

export const searchTopics = (
  topics: readonly Topic[],
  query: string,
  words: (topic: Topic) => readonly string[],
): readonly Topic[] => {
  const needle = fold(query.trim());
  if (needle === '') return topics;
  return topics.filter((topic) => words(topic).some((word) => fold(word).includes(needle)));
};

export const topicDayOf = (at: number, now: number): TopicDay => (at <= 0 ? 'new' : calendarDayOf(at, now));

export const groupTopics = (topics: readonly Topic[], now: number): readonly TopicGroup[] => {
  const newest = [...topics].sort((a, b) => b.at - a.at);
  return TOPIC_DAYS.map((day) => ({
    day,
    topics: newest.filter((topic) => topicDayOf(topic.at, now) === day),
  })).filter((group) => group.topics.length > 0);
};
