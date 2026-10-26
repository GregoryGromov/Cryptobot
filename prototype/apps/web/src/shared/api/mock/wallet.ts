import type { AgentKey, Tint } from './agents';
import type { Risk } from './cards';

export type Holding = {
  readonly asset: string;
  readonly amount: string;
  readonly usd: number;
  readonly tint: Tint;
  readonly earns: string | null;
};

export const HOLDINGS: readonly Holding[] = [
  { asset: 'USDRL', amount: '4 963 USDRL', usd: 4963, tint: 'violet', earns: '5,1% годовых' },
  { asset: 'USDC', amount: '2 482 USDC', usd: 2482, tint: 'blue', earns: null },
  { asset: 'ETH', amount: '1,2 ETH', usd: 3722, tint: 'emerald', earns: null },
  { asset: 'SOL', amount: '8,9 SOL', usd: 1241, tint: 'neutral', earns: '7,2% · стейкинг' },
  { asset: 'PAXG', amount: '0,25 PAXG · золото', usd: 1030, tint: 'amber', earns: null },
];

export type Template = {
  readonly key: 'conservative' | 'rwa' | 'balanced' | 'bold';
  readonly name: string;
  readonly about: string;
  readonly yield: string;
  readonly drawdown: string;
  readonly risk: Risk;
  readonly slices: readonly { readonly label: string; readonly share: number; readonly tint: Tint }[];
};

export const TEMPLATES: readonly Template[] = [
  {
    key: 'conservative',
    name: 'Консервативный',
    about: 'Больше стейблов в USDRL, остальное ETH и SOL',
    yield: '~6,8%',
    drawdown: 'до −15%',
    risk: 'low',
    slices: [
      { label: 'Стейблы', share: 60, tint: 'violet' },
      { label: 'ETH', share: 30, tint: 'emerald' },
      { label: 'SOL', share: 10, tint: 'amber' },
    ],
  },
  {
    key: 'rwa',
    name: 'Защитный с RWA',
    about: 'Облигации США и золото вместо части крипты',
    yield: '~5,9%',
    drawdown: 'до −10%',
    risk: 'low',
    slices: [
      { label: 'Стейблы', share: 35, tint: 'violet' },
      { label: 'Облигации США', share: 25, tint: 'blue' },
      { label: 'Золото', share: 20, tint: 'amber' },
      { label: 'ETH', share: 15, tint: 'emerald' },
      { label: 'Акции', share: 5, tint: 'neutral' },
    ],
  },
  {
    key: 'balanced',
    name: 'Сбалансированный',
    about: 'Поровну стейблов и крупных монет',
    yield: '~9%',
    drawdown: 'до −35%',
    risk: 'mid',
    slices: [
      { label: 'Стейблы', share: 40, tint: 'violet' },
      { label: 'ETH', share: 35, tint: 'emerald' },
      { label: 'BTC', share: 15, tint: 'amber' },
      { label: 'SOL', share: 10, tint: 'blue' },
    ],
  },
  {
    key: 'bold',
    name: 'Смелый',
    about: 'Монеты и альты, стейблы только на докупку',
    yield: '~14%',
    drawdown: 'до −60%',
    risk: 'high',
    slices: [
      { label: 'Стейблы', share: 15, tint: 'violet' },
      { label: 'ETH', share: 40, tint: 'emerald' },
      { label: 'SOL', share: 25, tint: 'blue' },
      { label: 'Альты', share: 20, tint: 'amber' },
    ],
  },
];

export type ContactState = 'verified' | 'own' | 'exchange' | 'new';

export type Contact = {
  readonly name: string;
  readonly address: string;
  readonly chain: string;
  readonly state: ContactState;
  readonly last: string;
};

export const CONTACTS: readonly Contact[] = [
  { name: 'Аня', address: '0x9c4e…41b2', chain: 'Arbitrum', state: 'verified', last: 'Сегодня · 100 USDC' },
  { name: 'Мама', address: '0x2f1a…c905', chain: 'Base', state: 'verified', last: '3 октября · 250 USDC' },
  { name: 'Холодный кошелёк', address: '0x51e7…a07d', chain: 'Base', state: 'own', last: 'Белый список Binance' },
  { name: 'Binance · депозит', address: '0x8d3b…7e21', chain: 'Ethereum', state: 'exchange', last: '12 сентября · 1 ETH' },
  { name: 'Сергей', address: '0x4b70…d11f', chain: 'Base', state: 'new', last: 'Переводов ещё не было' },
];

export type JournalState = 'done' | 'auto' | 'pending' | 'blocked';

export type JournalEntry = {
  readonly day: string;
  readonly time: string;
  readonly agent: AgentKey;
  readonly text: string;
  readonly why: string;
  readonly state: JournalState;
  readonly tx: string | null;
};

export const JOURNAL: readonly JournalEntry[] = [
  {
    day: 'Сегодня',
    time: '14:07',
    agent: 'trader',
    text: 'Подготовил своп 500 USDC → 0,1613 ETH',
    why: 'Ваша команда в чате',
    state: 'pending',
    tx: null,
  },
  {
    day: 'Сегодня',
    time: '14:02',
    agent: 'guard',
    text: 'Нашёл бессрочный approve на USDC у контракта 0x7a3…9f1',
    why: 'Контракт похож на дрейнер и не верифицирован',
    state: 'pending',
    tx: null,
  },
  {
    day: 'Сегодня',
    time: '13:42',
    agent: 'treasurer',
    text: 'Создал вывод 300 USDC с Binance на холодный кошелёк',
    why: 'Ваша команда в чате',
    state: 'pending',
    tx: null,
  },
  {
    day: 'Сегодня',
    time: '12:05',
    agent: 'trader',
    text: 'Перевёл Ане 100 USDC: Base → Arbitrum через Across',
    why: 'Ваша команда в чате, адрес из контактов',
    state: 'done',
    tx: '0x3f9a…e012',
  },
  {
    day: 'Сегодня',
    time: '11:20',
    agent: 'guard',
    text: 'Не дал перевести 100 USDC на 0x9c4e…41b3',
    why: 'Адрес похож на адрес Ани, но отличается последним символом: это подмена',
    state: 'blocked',
    tx: null,
  },
  {
    day: 'Сегодня',
    time: '07:10',
    agent: 'guard',
    text: 'Довнёс 200 USDC в залог на Aave',
    why: 'Health factor упал до 1,32, ваше правило — держать выше 1,5',
    state: 'auto',
    tx: '0x77c2…9b40',
  },
  {
    day: 'Вчера',
    time: '18:00',
    agent: 'treasurer',
    text: 'Ребаланс по шаблону «Консервативный», 3 сделки',
    why: 'Рутина «Ребаланс портфеля»',
    state: 'auto',
    tx: '0x1d0e…44fa',
  },
  {
    day: 'Вчера',
    time: '09:00',
    agent: 'coordinator',
    text: 'Отправил утренний брифинг',
    why: 'Рутина «Утренний брифинг»',
    state: 'done',
    tx: null,
  },
];

export const POINTS = 1240;

export const FORCE_BALANCE = 2400;

export const FORCE_STAKE = 1000;

export type Earn = { readonly title: string; readonly reward: string };

export const EARNINGS: readonly Earn[] = [
  { title: 'Держите USDRL', reward: '1 балл в день за каждые $100' },
  { title: 'Купите USDRL через бота', reward: '+50 баллов за каждые $1 000' },
  { title: 'Сделка через агента', reward: '+5 баллов' },
  { title: 'Пригласите друга', reward: '+200 баллов' },
];

export const BASE_PERKS: readonly string[] = ['Советы и approve', 'Лимит $1 000 в день', '5 агентов', 'Баллы ×1'];

export const PREMIUM_PERKS: readonly string[] = [
  'Уровень доверия «Переводы»',
  'Лимит $10 000 в день',
  'Баллы ×1,5',
  'Свопы без комиссии',
  'Свои агенты и рутины',
  'Приоритетное исполнение',
];

export const HEALTH = { value: 1.61, safe: 1.5, danger: 1.2, where: 'Aave · Base', liquidation: 'Ликвидация при ETH $1 980' };

export const PROTOCOL_RISKS: readonly { readonly name: string; readonly risk: Risk; readonly why: string }[] = [
  { name: 'Aave', risk: 'low', why: '6 лет без взломов' },
  { name: 'Morpho', risk: 'mid', why: 'Молодые хранилища' },
  { name: 'Pendle', risk: 'high', why: 'Ставка на доходность' },
];

export const EXCHANGES = ['Binance', 'OKX', 'Bybit'];
