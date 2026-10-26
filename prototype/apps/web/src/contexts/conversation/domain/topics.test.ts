import type { Chats, MarketName } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { groupTopics, searchTopics, type Topic, topicDayOf, topicsOf, visitingMarket } from './topics';

const NOW = new Date(2026, 9, 9, 12, 0).getTime();
const TODAY = new Date(2026, 9, 9, 9, 30).getTime();
const YESTERDAY = new Date(2026, 9, 8, 22, 15).getTime();
const EARLIER = new Date(2026, 9, 1, 10, 0).getTime();

const chats: Chats = {
  status: null,
  lastSignalAt: null,
  broker: { key: 'broker', preview: null, at: YESTERDAY, unread: 0, spoken: true },
  talks: [{ key: 'talk-7', preview: null, at: TODAY, unread: 2, spoken: true, title: 'Что с золотом?' }],
  markets: [
    {
      key: 'BTC',
      preview: null,
      at: EARLIER,
      unread: 1,
      spoken: false,
      coin: 'BTC',
      name: 'Bitcoin',
      ticker: 'BTC',
      cls: 'majors',
      price: 60_000,
      change1h: 0.4,
      watched: true,
      position: { side: 'LONG', pnl: 12.5 },
    },
    {
      key: 'xyz:GOLD',
      preview: null,
      at: 0,
      unread: 0,
      spoken: false,
      coin: 'xyz:GOLD',
      name: 'Золото',
      ticker: 'GOLD',
      cls: 'commodities',
      price: 2_400,
      change1h: -0.2,
      watched: true,
      position: null,
    },
  ],
};

const instruments: readonly MarketName[] = [
  { coin: 'BTC', name: 'Bitcoin', ticker: 'BTC', cls: 'majors' },
  { coin: 'ETH', name: 'Ethereum', ticker: 'ETH', cls: 'majors' },
  { coin: 'xyz:SILVER', name: 'Серебро', ticker: 'SILVER', cls: 'commodities' },
];

const words = (topic: Topic): readonly string[] => [
  topic.title ?? 'Общий разговор',
  topic.market?.ticker ?? '',
];

const keysByDay = (visiting: string | null, query: string) =>
  groupTopics(searchTopics(topicsOf(chats, visitingMarket(visiting, instruments)), query, words), NOW).map(
    (group) => ({ day: group.day, keys: group.topics.map((topic) => topic.key) }),
  );

describe('topicDayOf', () => {
  it('calls a topic with nothing said yet new', () => {
    expect(topicDayOf(0, NOW)).toBe('new');
  });

  it('counts calendar days, not 24-hour spans', () => {
    expect(topicDayOf(YESTERDAY, new Date(2026, 9, 9, 0, 30).getTime())).toBe('yesterday');
  });
});

describe('the topic list', () => {
  it('lists topics newest first, the general conversation among them', () => {
    expect(topicsOf(chats, null).map((topic) => topic.key)).toEqual(['talk-7', 'broker', 'BTC', 'xyz:GOLD']);
  });

  it('groups topics by the day they were last spoken in, newest first', () => {
    expect(keysByDay(null, '')).toEqual([
      { day: 'today', keys: ['talk-7'] },
      { day: 'yesterday', keys: ['broker'] },
      { day: 'earlier', keys: ['BTC'] },
      { day: 'new', keys: ['xyz:GOLD'] },
    ]);
  });

  it('finds a market by its ticker', () => {
    expect(keysByDay(null, ' gold ')).toEqual([{ day: 'new', keys: ['xyz:GOLD'] }]);
  });

  it('finds topics by name in any case', () => {
    expect(keysByDay(null, 'ЗОЛОТ')).toEqual([
      { day: 'today', keys: ['talk-7'] },
      { day: 'new', keys: ['xyz:GOLD'] },
    ]);
  });

  it('finds the general conversation by the name the caller gives it', () => {
    expect(keysByDay(null, 'общий')).toEqual([{ day: 'yesterday', keys: ['broker'] }]);
  });

  it('keeps every topic for a blank query', () => {
    expect(searchTopics(topicsOf(chats, null), '  ', words)).toHaveLength(4);
  });

  it('drops every group when nothing matches', () => {
    expect(keysByDay(null, 'doge')).toEqual([]);
  });

  it('lists an opened market that has no topic yet among the new ones', () => {
    expect(keysByDay('ETH', '')).toContainEqual({ day: 'new', keys: ['ETH', 'xyz:GOLD'] });
  });

  it('finds the opened market by its coin', () => {
    expect(keysByDay('xyz:SILVER', 'silver')).toEqual([{ day: 'new', keys: ['xyz:SILVER'] }]);
  });

  it('does not repeat a market that already has a topic', () => {
    expect(keysByDay('BTC', '').flatMap((group) => group.keys)).toEqual([
      'talk-7',
      'broker',
      'BTC',
      'xyz:GOLD',
    ]);
  });

  it('carries the open position and unread count of a market', () => {
    const btc = topicsOf(chats, null).find((topic) => topic.key === 'BTC');
    expect({ position: btc?.position, unread: btc?.unread }).toEqual({
      position: { side: 'LONG', pnl: 12.5 },
      unread: 1,
    });
  });
});
