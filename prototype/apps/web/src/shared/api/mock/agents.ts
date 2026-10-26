import { ArrowLeftRight, Landmark, type LucideIcon, Newspaper, ShieldCheck, Sparkles } from 'lucide-react';

export type AgentKey = 'coordinator' | 'guard' | 'trader' | 'treasurer' | 'analyst';

export type Trust = 'advice' | 'approve' | 'transfer';

export type Tint = 'violet' | 'blue' | 'emerald' | 'amber' | 'neutral';

export type Routine = { readonly title: string; readonly when: string; readonly paused?: boolean };

export type Agent = {
  readonly key: AgentKey;
  readonly topic: string;
  readonly name: string;
  readonly icon: LucideIcon;
  readonly tint: Tint;
  readonly about: string;
  readonly trust: Trust | null;
  readonly limit: string | null;
  readonly duty: string;
  readonly routines: readonly Routine[];
};

export const AGENTS: readonly Agent[] = [
  {
    key: 'coordinator',
    topic: 'broker',
    name: 'Координатор',
    icon: Sparkles,
    tint: 'violet',
    about: 'Главный агент: понимает задачу, раздаёт её остальным и собирает ваши подтверждения',
    trust: null,
    limit: null,
    duty: 'Собирает утренний брифинг',
    routines: [
      { title: 'Утренний брифинг', when: 'Каждый день в 9:00' },
      { title: 'Итоги недели', when: 'По воскресеньям в 20:00' },
    ],
  },
  {
    key: 'guard',
    topic: 'talk-guard',
    name: 'Страж',
    icon: ShieldCheck,
    tint: 'blue',
    about: 'Проверяет каждое действие других агентов: симуляция, адрес получателя, лимиты',
    trust: null,
    limit: null,
    duty: 'Следит за approve и адресами',
    routines: [
      { title: 'Проверка approve', when: 'Каждый час' },
      { title: 'Риск ликвидации', when: 'Постоянно' },
    ],
  },
  {
    key: 'trader',
    topic: 'talk-trader',
    name: 'Трейдер',
    icon: ArrowLeftRight,
    tint: 'emerald',
    about: 'Свопы, бриджинг, RWA и переводы по книге контактов',
    trust: 'approve',
    limit: '$1 000 в день',
    duty: 'Ждёт подтверждения свопа',
    routines: [{ title: 'Покупка ETH на $100', when: 'По понедельникам в 10:00', paused: true }],
  },
  {
    key: 'treasurer',
    topic: 'talk-treasurer',
    name: 'Казначей',
    icon: Landmark,
    tint: 'amber',
    about: 'Консервативный портфель, вывод с CEX, рутины по расписанию',
    trust: 'advice',
    limit: '$500 в день',
    duty: 'Держит долю стейблов 60%',
    routines: [
      { title: 'Ребаланс портфеля', when: 'По пятницам в 9:00' },
      { title: 'Прибыль в USDRL', when: '1-го числа каждого месяца' },
    ],
  },
  {
    key: 'analyst',
    topic: 'talk-analyst',
    name: 'Аналитик',
    icon: Newspaper,
    tint: 'neutral',
    about: 'Новости, депеги, взломы протоколов и объяснения про DeFi',
    trust: null,
    limit: null,
    duty: 'Читает новости по вашим протоколам',
    routines: [{ title: 'Дайджест DeFi', when: 'Каждый день в 8:30' }],
  },
];

export const TRUST_LEVELS: readonly Trust[] = ['advice', 'approve', 'transfer'];

export const agentOfTopic = (topic: string | null): Agent | undefined =>
  AGENTS.find((agent) => agent.topic === topic);

export const STARTERS = [
  'Выведи с Binance',
  'Купи золота на $500',
  'Мой health factor?',
  'Что даёт Premium?',
];

export const AWAITING: readonly { readonly agent: AgentKey; readonly text: string; readonly meta: string }[] = [
  { agent: 'guard', text: 'Отозвать бессрочный approve USDC', meta: 'Контракт 0x7a3…9f1 не верифицирован' },
  { agent: 'trader', text: 'Подтвердить своп 500 USDC → 0,1613 ETH', meta: 'Base · Uniswap · газ $0,04' },
  { agent: 'treasurer', text: 'Подтвердить вывод 300 USDC с Binance', meta: 'В приложении Binance' },
];

export const agentOf = (key: AgentKey): Agent => AGENTS.find((agent) => agent.key === key) ?? (AGENTS[0] as Agent);
