import type { Chat, ChatItem, ChatMessage, ForecastNote, SignalView } from '@reinforce/server/dto';
import type { FailedItem, Pending } from './chat-types';

export const NOON = new Date(2026, 9, 9, 12, 0).getTime();
export const YESTERDAY_NOON = new Date(2026, 9, 8, 12, 0).getTime();

export const message = (over: Partial<ChatMessage> & Pick<ChatMessage, 'key'>): ChatMessage => ({
  kind: 'message',
  at: NOON,
  role: 'broker',
  text: '',
  requestId: null,
  followUps: [],
  span: null,
  channel: 'web',
  threadId: '',
  forecast: null,
  signal: null,
  proposal: null,
  tradeId: null,
  options: null,
  handoff: null,
  ...over,
});

export const said = (key: string, text: string, at = NOON): ChatMessage =>
  message({ key, text, at, role: 'user' });

export const answer = (key: string, text: string, at = NOON): ChatMessage => message({ key, text, at });

const signalView: SignalView = {
  eventId: 'event-1',
  eventAt: NOON,
  staleAt: NOON + 900_000,
  move: 1.8,
  horizon: 5,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: true,
  times: 3,
  spark: null,
};

export const signalItem = (key: string): ChatItem => ({ ...signalView, kind: 'signal', key, at: NOON });

export const failedItem = (key: string, runKind: FailedItem['runKind']): FailedItem => ({
  kind: 'failed',
  key,
  at: NOON,
  runId: `run-${key}`,
  runKind,
  error: null,
  retry: true,
});

export const forecastNote = (id: string, threadId: string): ForecastNote => ({
  id,
  threadId,
  coin: 'BTC',
  at: NOON,
  t0: NOON + 60_000,
  p0: 64_000,
  cohort: 'on-demand',
  version: 1,
  headline: 'Скорее вверх',
  thesis: 'Покупатели держат уровень.',
  horizons: [],
  plan: { action: 'FLAT', horizon: 15 },
  points: [],
  invalidation: null,
  mark: null,
});

export const pending = (over: Partial<Pending> & Pick<Pending, 'id'>): Pending => ({
  kind: 'converse',
  t0: null,
  deadline: null,
  since: NOON,
  attempt: 1,
  ...over,
});

export const chatOf = (over: Partial<Chat>): Chat => ({
  conversationId: null,
  seq: 0,
  key: 'talk-a',
  title: 'Что с золотом?',
  market: null,
  items: [],
  pending: [],
  model: true,
  needsLogin: false,
  unread: 0,
  firstUnread: null,
  position: null,
  ticket: null,
  latestThread: null,
  live: null,
  record: null,
  ...over,
});

export const btc = {
  coin: 'BTC',
  name: 'Bitcoin',
  ticker: 'BTC',
  cls: 'majors',
  price: 64_250.5,
  change1h: 0.42,
} as const satisfies NonNullable<Chat['market']>;
