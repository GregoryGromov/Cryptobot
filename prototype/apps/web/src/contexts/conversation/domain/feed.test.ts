import { describe, expect, it } from 'vitest';
import { feedRows, linkedForecast, opensDay, UNREAD_ANCHOR, unreadAnchor } from './feed';
import {
  answer,
  failedItem,
  forecastNote,
  message,
  NOON,
  pending,
  said,
  signalItem,
  YESTERDAY_NOON,
} from './fixtures.test-util';

const kinds = (rows: ReturnType<typeof feedRows>) =>
  rows.map((row) => (row.kind === 'entry' ? row.key : row.kind));

describe('feedRows', () => {
  it('names a day where it begins', () => {
    const rows = feedRows({
      items: [said('m1', 'Вчера', YESTERDAY_NOON), said('m2', 'Сегодня', NOON)],
      unreadFrom: null,
      live: false,
      hidden: null,
    });
    expect(kinds(rows)).toEqual(['day', 'm1', 'day', 'm2']);
  });

  it('puts the line over what is new right before its first entry', () => {
    const rows = feedRows({
      items: [answer('m1', 'Раз'), answer('m2', 'Два'), answer('m3', 'Три')],
      unreadFrom: 'm2',
      live: false,
      hidden: null,
    });
    expect(kinds(rows)).toEqual(['day', 'm1', 'unread', 'm2', 'm3']);
  });

  it('gives the unread line its anchor id', () => {
    const rows = feedRows({
      items: [answer('m1', 'Раз'), answer('m2', 'Два')],
      unreadFrom: 'm2',
      live: false,
      hidden: null,
    });
    expect(rows.find((row) => row.kind === 'unread')?.key).toBe(UNREAD_ANCHOR);
  });

  it('folds a failed analysis under the signal it answered', () => {
    const rows = feedRows({
      items: [signalItem('s1'), failedItem('f1', 'forecast')],
      unreadFrom: null,
      live: false,
      hidden: null,
    });
    expect(
      rows.flatMap((row) => (row.kind === 'entry' ? [[row.key, row.failure?.key ?? null]] : [])),
    ).toEqual([['s1', 'f1']]);
  });

  it('keeps a failed answer as its own line', () => {
    const rows = feedRows({
      items: [said('m1', 'Вопрос'), failedItem('f1', 'converse')],
      unreadFrom: null,
      live: false,
      hidden: null,
    });
    expect(kinds(rows)).toEqual(['day', 'm1', 'f1']);
  });

  it('opens the general conversation with the broker line and the live block under it, undated', () => {
    const rows = feedRows({
      items: [answer('hello', 'Я ваш брокер.', 0), said('m1', 'Привет')],
      unreadFrom: null,
      live: true,
      hidden: null,
    });
    expect(kinds(rows)).toEqual(['hello', 'live', 'day', 'm1']);
  });

  it('marks a line that goes on from the same side', () => {
    const rows = feedRows({
      items: [said('m1', 'Раз'), said('m2', 'Два'), answer('m3', 'Ответ')],
      unreadFrom: null,
      live: false,
      hidden: null,
    });
    expect(rows.flatMap((row) => (row.kind === 'entry' ? [row.follows] : []))).toEqual([false, true, false]);
  });

  it('leaves out the entry an answer being laid down stands for', () => {
    const rows = feedRows({
      items: [said('m1', 'Вопрос'), answer('m2', 'Ответ')],
      unreadFrom: null,
      live: false,
      hidden: 'm2',
    });
    expect(kinds(rows)).toEqual(['day', 'm1']);
  });

  it('stands a forecast with the broker words after it as the card and then the words', () => {
    const reply = message({
      key: 'f1',
      text: 'Скорее вверх, вход по рынку.',
      forecast: forecastNote('fc1', 'd1'),
    });
    const rows = feedRows({ items: [reply], unreadFrom: null, live: false, hidden: null });
    expect(kinds(rows)).toEqual(['day', 'f1', 'f1:words']);
  });

  it('keeps the card of a forecast whose words are being laid down', () => {
    const reply = message({
      key: 'f1',
      text: 'Скорее вверх, вход по рынку.',
      forecast: forecastNote('fc1', 'd1'),
    });
    const rows = feedRows({ items: [reply], unreadFrom: null, live: false, hidden: 'f1' });
    expect(kinds(rows)).toEqual(['day', 'f1']);
  });
});

describe('unreadAnchor', () => {
  const items = [answer('m1', 'Раз'), answer('m2', 'Два')];

  it('opens at the first unread entry', () => {
    expect(unreadAnchor({ items, pending: [], firstUnread: 'm2' })).toBe('m2');
  });

  it('opens at the end when the reader is waiting for an answer', () => {
    expect(unreadAnchor({ items, pending: [pending({ id: 'run-1' })], firstUnread: 'm2' })).toBeNull();
  });

  it('draws no line over the very first entry', () => {
    expect(unreadAnchor({ items, pending: [], firstUnread: 'm1' })).toBeNull();
  });
});

describe('linkedForecast', () => {
  const items = [
    message({ key: 'f1', forecast: forecastNote('forecast-1', 'thread-1') }),
    message({ key: 'f2', forecast: forecastNote('forecast-2', 'thread-2') }),
  ];

  it('finds the forecast a link names by its thread', () => {
    expect(linkedForecast(items, 'thread-1')).toBe('forecast-1');
  });

  it('finds nothing for a thread that has no forecast yet', () => {
    expect(linkedForecast(items, 'thread-9')).toBeNull();
  });
});

describe('opensDay', () => {
  it('opens a day for words said after midnight', () => {
    expect(opensDay([said('m1', 'Вчера', YESTERDAY_NOON)], NOON)).toBe(true);
  });

  it('opens no day for words said the same day', () => {
    expect(opensDay([said('m1', 'Утром', NOON - 3_600_000)], NOON)).toBe(false);
  });
});
