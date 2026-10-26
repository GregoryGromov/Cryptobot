import type { Tint } from './agents';

export type CardKind = 'swap' | 'transfer' | 'contract' | 'alert' | 'withdraw' | 'portfolio' | 'yields';

export type CardStatus = 'pending' | 'done' | 'auto' | 'safe' | 'danger';

export type Risk = 'low' | 'mid' | 'high';

export type AgentCard = {
  readonly kind: CardKind;
  readonly title: string;
  readonly status?: CardStatus;
  readonly headline?: string;
  readonly rows?: readonly { readonly label: string; readonly value: string; readonly tag?: string }[];
  readonly checks?: readonly { readonly ok: boolean; readonly text: string }[];
  readonly steps?: readonly { readonly state: 'done' | 'now' | 'next'; readonly text: string }[];
  readonly slices?: readonly { readonly label: string; readonly share: number; readonly tint: Tint }[];
  readonly yields?: readonly { readonly name: string; readonly apy: string; readonly risk: Risk }[];
};

const CARDS: Record<string, AgentCard> = {
  g0: {
    kind: 'alert',
    title: 'Риск ликвидации · Aave · Base',
    status: 'auto',
    headline: 'Health factor 1,32 → 1,61',
    rows: [
      { label: 'Залог', value: '1,2 ETH + 200 USDC' },
      { label: 'Долг', value: '1 800 USDC' },
      { label: 'Ликвидация', value: 'при ETH $2 410 → теперь $1 980' },
      { label: 'Правило', value: 'Держать health factor выше 1,5' },
    ],
  },
  g1: {
    kind: 'contract',
    title: 'Проверка контракта 0x7a3…9f1',
    status: 'danger',
    headline: 'Бессрочный approve на все USDC',
    checks: [
      { ok: false, text: 'Код контракта не верифицирован' },
      { ok: false, text: 'Создан 3 дня назад' },
      { ok: false, text: 'Похож на дрейнер из базы скам-контрактов' },
      { ok: true, text: 'Нет в санкционных списках' },
    ],
    rows: [{ label: 'Отзыв', value: '$0,03', tag: 'Газ в USDC' }],
  },
  t0b: {
    kind: 'swap',
    title: 'Покупка золота · Ethereum',
    status: 'done',
    headline: '1 000 USDC → 0,2428 PAXG',
    rows: [
      { label: 'Обеспечение', value: '1 PAXG = 1 тройская унция золота', tag: 'RWA' },
      { label: 'Эмитент', value: 'Paxos, хранилища в Лондоне' },
      { label: 'Торги', value: '24/7, без выходных биржи' },
      { label: 'Газ', value: '$0,35, списан в USDC', tag: 'Без ETH на газ' },
    ],
    checks: [
      { ok: true, text: 'Контракт PAXG проверен' },
      { ok: true, text: 'Резервы подтверждены ежемесячной аттестацией' },
    ],
  },
  t2: {
    kind: 'transfer',
    title: 'Перевод · Аня',
    status: 'done',
    headline: '100 USDC',
    rows: [
      { label: 'Кому', value: 'Аня · 0x9c4…41b', tag: 'Из контактов' },
      { label: 'Маршрут', value: 'Base → Arbitrum · мост Across · 40 с' },
      { label: 'Газ', value: '$0,06, списан в USDC', tag: 'Без ETH на газ' },
    ],
    checks: [
      { ok: true, text: 'Адрес совпадает с контактом' },
      { ok: true, text: 'Не похож на подменённый адрес' },
      { ok: true, text: 'Нет в санкционных списках' },
    ],
  },
  t4: {
    kind: 'swap',
    title: 'Своп · Base · Uniswap',
    status: 'pending',
    headline: '500 USDC → 0,1613 ETH',
    rows: [
      { label: 'Курс', value: '1 ETH = $3 099' },
      { label: 'Проскальзывание', value: 'до 0,3%' },
      { label: 'Газ', value: '$0,04, спишется в USDC', tag: 'Без ETH на газ' },
      { label: 'Лимит', value: '$500 из $1 000 в день' },
    ],
    checks: [
      { ok: true, text: 'Симуляция: получите 0,1609–0,1613 ETH' },
      { ok: true, text: 'Контракт Uniswap проверен' },
    ],
  },
  r1: {
    kind: 'portfolio',
    title: 'Ребаланс · шаблон «Консервативный»',
    status: 'done',
    slices: [
      { label: 'USDRL', share: 40, tint: 'violet' },
      { label: 'USDC', share: 20, tint: 'blue' },
      { label: 'ETH', share: 30, tint: 'emerald' },
      { label: 'SOL', share: 10, tint: 'amber' },
    ],
    rows: [
      { label: 'Доходность', value: '~6,8% годовых' },
      { label: 'Сделки', value: '3 · комиссия $1,20' },
    ],
  },
  r3: {
    kind: 'withdraw',
    title: 'Вывод с Binance',
    status: 'pending',
    headline: '300 USDC',
    rows: [
      { label: 'Куда', value: 'Мой кошелёк · 0x51e…a07', tag: 'Белый список' },
      { label: 'Сеть', value: 'Base · комиссия биржи $0,10' },
    ],
    steps: [
      { state: 'done', text: 'Запрос создан. Ключ Binance разрешает только вывод на белый список' },
      { state: 'now', text: 'Подтвердите вывод в приложении Binance' },
      { state: 'next', text: 'Зачисление на кошелёк, около 2 минут' },
    ],
  },
  a1: {
    kind: 'alert',
    title: 'Депег USDe',
    status: 'safe',
    headline: '$0,97 → $0,998',
    rows: [
      { label: 'Длился', value: '40 минут, минимум в 03:12' },
      { label: 'У вас USDe', value: 'Нет' },
      { label: 'Источники', value: 'Chainlink, пулы Curve' },
    ],
  },
  a1b: {
    kind: 'alert',
    title: 'Взлом · Lumen Finance',
    status: 'safe',
    headline: 'Выведено $12 млн',
    rows: [
      { label: 'Ваши средства', value: 'Не затронуты' },
      { label: 'Approve на контракт', value: 'Нет' },
    ],
  },
  a5: {
    kind: 'yields',
    title: 'Доходность на стейблах сегодня',
    yields: [
      { name: 'USDRL', apy: '5,1%', risk: 'low' },
      { name: 'Aave · USDC', apy: '4,3%', risk: 'low' },
      { name: 'Morpho · USDC', apy: '6,9%', risk: 'mid' },
      { name: 'Pendle · PT-USDe', apy: '11,2%', risk: 'high' },
    ],
  },
};

export const cardOf = (key: string): AgentCard | undefined => CARDS[key];
