import type { Chat, ChatMessage, Chats, Pulse, Session } from '@reinforce/server/dto';
import { AGENTS, type AgentKey } from './agents';

const MINUTE = 60_000;
const at = (minutesAgo: number) => Date.now() - minutesAgo * MINUTE;

const message = (over: Partial<ChatMessage> & Pick<ChatMessage, 'key' | 'text'>): ChatMessage => ({
  kind: 'message',
  at: Date.now(),
  role: 'broker',
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

const said = (key: string, text: string, minutesAgo: number) =>
  message({ key, text, role: 'user', at: at(minutesAgo) });

const answer = (key: string, text: string, minutesAgo: number, over: Partial<ChatMessage> = {}) =>
  message({ key, text, at: at(minutesAgo), ...over });

const choice = (label: string, text = label) => ({ label, text, classes: null, chat: null, glance: null });

const STARTING: Record<AgentKey, ChatMessage[]> = {
  coordinator: [
    said('c1', 'Что случилось за ночь?', 52),
    answer(
      'c2',
      'Ночь прошла спокойно. Коротко по агентам:\n\n- **Страж** довнёс 200 USDC в залог на Aave, когда ETH упал на 6%\n- **Страж** нашёл опасный approve на USDC\n- **Казначей** сделал ребаланс, доля стейблов снова 60%\n- **Аналитик:** USDe на 40 минут отвязался до $0,97, вас это не касается\n\nТри действия ждут вас: отзыв approve, своп 500 USDC → ETH и вывод с Binance.',
      51,
      { followUps: ['Покажи своп', 'Что с портфелем?', 'Где заработать на стейблах?'] },
    ),
  ],
  guard: [
    answer(
      'g0',
      'ETH упал на 6% за час, и позиция на Aave подошла к ликвидации. Довнёс 200 USDC из резерва: ваши правила это разрешают.',
      190,
    ),
    answer(
      'g1',
      'Пока вас не было, нашёл бессрочный approve на USDC. Этот контракт может списать **все** ваши USDC без лимита. Отозвать?',
      14,
      { options: [choice('Отозвать', 'Отзови approve'), choice('Оставить', 'Оставь, это мой контракт')] },
    ),
  ],
  trader: [
    said('t0a', 'Купи золота на $1 000', 240),
    answer('t0b', 'Купил токенизированное золото: каждый PAXG обеспечен унцией в хранилище.', 239),
    said('t1', 'Отправь Ане 100 USDC, она на Arbitrum', 130),
    answer('t2', 'Отправил. Аня есть в ваших контактах, Страж проверил адрес, мост выбрал сам.', 128),
    said('t3', 'Купи ETH на 500 USDC', 9),
    answer('t4', 'Своп готов, Страж всё проверил. Подтверждаете?', 9, {
      options: [choice('Подтвердить', 'Подтверждаю своп'), choice('Отменить', 'Отмени своп')],
    }),
  ],
  treasurer: [
    answer('r1', 'Пятничный ребаланс сделан, портфель снова совпадает с шаблоном.', 180),
    said('r2', 'Выведи 300 USDC с Binance на кошелёк', 35),
    answer(
      'r3',
      'Подготовил вывод на ваш адрес из белого списка. Осталось подтвердить его в Binance: вывести куда-то ещё я не могу.',
      34,
      { followUps: ['Положи их в USDRL', 'Сколько у меня стейблов?'] },
    ),
  ],
  analyst: [
    answer('a1', 'USDe ненадолго отвязался от доллара. USDe у вас нет, делать ничего не нужно.', 95),
    answer('a1b', 'Взломали Lumen Finance. Ваших денег там нет, approve на их контракты тоже.', 60),
    said('a2', 'Что такое депег?', 22),
    answer(
      'a3',
      'Депег — это когда стейблкоин теряет привязку к доллару: например, USDC стоит $0,97 вместо $1.\n\n- Обычно это длится минуты или часы\n- Опасен, если стейбл лежит в залоге: можно попасть под ликвидацию\n\nЕсли такое случится с вашими стейблами, Страж напишет сразу.',
      21,
    ),
    said('a4', 'А где заработать на стейблах?', 20),
    answer(
      'a5',
      'Чем выше доходность, тем больше риск. **USDRL** и **Aave** платят меньше, зато это займы под надёжный залог. **Pendle** платит больше, потому что это ставка на будущую доходность USDe.',
      19,
      { followUps: ['Почему у Pendle выше?', 'Положи 1 000 USDC в USDRL'] },
    ),
  ],
};

const REPLIES: Record<AgentKey, string> = {
  coordinator: 'Принял. Передал задачу нужному агенту, результат будет в его чате.',
  guard: 'Готово. Approve отозван, запись в журнале.',
  trader: 'Готово, своп исполнен: получено 0,1612 ETH. Газ $0,04 списан в USDC, запись в журнале.',
  treasurer: 'Сделаю, как придут деньги: 300 USDC → USDRL. Это ~5,1% годовых и +3 балла в день.',
  analyst: 'Хороший вопрос. Это болванка: здесь будет ответ Аналитика.',
};

const UNREAD: Record<AgentKey, number> = { coordinator: 0, guard: 1, trader: 1, treasurer: 0, analyst: 0 };

type Store = Record<string, { agent: AgentKey; items: ChatMessage[]; seq: number }>;

const store: Store = Object.fromEntries(
  AGENTS.map((agent) => [agent.topic, { agent: agent.key, items: [...STARTING[agent.key]], seq: 1 }]),
);

const entry = (topic: string) => {
  const found = store[topic];
  if (!found) throw new Error(`Unknown topic ${topic}`);
  return found;
};

export const chatView = (topic: string): Chat => {
  const { agent, items, seq } = entry(topic);
  return {
    conversationId: topic,
    seq,
    key: topic,
    title: AGENTS.find((each) => each.key === agent)?.name ?? null,
    market: null,
    items,
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
  };
};

const summary = (topic: string) => {
  const { agent, items } = entry(topic);
  const last = items.at(-1);
  return {
    key: topic,
    at: last?.at ?? Date.now(),
    unread: seenTopics.has(topic) ? 0 : UNREAD[agent],
    spoken: true,
    preview: last ? { kind: 'text' as const, at: last.at, role: last.role, text: last.text } : null,
  };
};

const seenTopics = new Set<string>();

export const chatsView = (): Chats => {
  const [coordinator, ...talks] = AGENTS;
  return {
    status: null,
    lastSignalAt: null,
    broker: summary(coordinator?.topic ?? 'broker'),
    talks: talks.map((agent) => ({ ...summary(agent.topic), title: agent.name })),
    markets: [],
  };
};

export const markRead = (topic: string) => {
  seenTopics.add(topic);
};

export const send = (topic: string, text: string, requestId: string) => {
  const chat = entry(topic);
  const user = message({ key: `u-${requestId}`, text, role: 'user', requestId });
  chat.items.push(user);
  chat.seq += 1;
  setTimeout(() => {
    chat.items.push(message({ key: `b-${requestId}`, text: REPLIES[chat.agent] }));
    chat.seq += 1;
  }, 1_200);
  return { kind: 'sent' as const, entry: { ...user, id: user.key }, replayed: false, chat: topic };
};

const SESSION_NOW = Date.now();

export const pulseView = (): Pulse => ({
  accountId: 'demo',
  now: Date.now(),
  telegramLinkId: null,
  conversations: Object.fromEntries(Object.entries(store).map(([topic, chat]) => [topic, chat.seq])),
  market: { phase: 'ready', lastBarEnd: SESSION_NOW, message: null, loaded: 1, total: 1 },
});

export const sessionView = (): Session => ({
  environment: 'live',
  locale: 'ru',
  user: { name: 'Григорий', guest: false },
  auth: { xaiAvailable: true, ownModelAvailable: true },
  model: true,
  ai: { own: true, route: 'own', free: { left: 50, limit: 50, resetAt: SESSION_NOW + 86_400_000 } },
  agent: { id: 'demo-agent' },
  balance: { nav: 12408.2, returnPct: 0.68 },
  connection: { provider: 'xai', model: 'grok-4' },
  version: null,
  preferences: {
    classes: [],
    markets: [],
    mode: 'daytrader',
    maxTradeUsd: 1000,
    analysisLimit: 10,
    ideaLimit: 10,
    autoAnalysis: false,
    alerts: true,
    actionableOnly: false,
    quiet: { on: false, from: 0, to: 0, tz: 'Europe/Moscow' },
    style: '',
  },
  telegram: { linked: false, username: null, bot: null, available: false },
  market: { phase: 'ready', lastBarEnd: SESSION_NOW, message: null, loaded: 1, total: 1, instruments: [] },
  classes: [],
  rules: {
    detector: { profile: 'demo', version: '1', robustZ: null },
    tauPct: { 5: 0.1, 15: 0.2, 30: 0.3, 60: 0.4 },
    execution: {
      version: '1',
      feeRate: 0.0005,
      slippageBps: { high: 1, medium: 2, lower: 3 },
      funding: 'DISABLED',
      startNav: 10000,
    },
    t0OffsetSeconds: 0,
    customRuntime: null,
  },
});
