import type { BookCycle, Chat, ChatProposal, Estimate, TradeRow, Trades } from '@reinforce/server/dto';

const MINUTE = 60_000;

export const T0 = Date.UTC(2026, 9, 9, 12, 0);

type Pending = Extract<TradeRow, { status: 'pending' }>;
type Rejected = Extract<TradeRow, { status: 'rejected' }>;
type Open = Extract<TradeRow, { status: 'open' }>;
type Closed = Extract<TradeRow, { status: 'closed' }>;

const base = {
  id: 'trade-1',
  cycleId: 'cycle-1',
  book: 'user',
  coin: 'xyz:GOLD',
  name: 'Gold',
  side: 'LONG',
  horizon: 15,
  stopLossPct: 1,
  takeProfitPct: 2,
  entryAt: T0,
  exitDeadline: T0 + 15 * MINUTE,
  source: 'proposal',
  note: '',
  requested: 500,
  requestedPct: null,
  threadId: null,
} as const;

const entered = {
  entry: { at: T0, refPrice: 2000, price: 2000.4, fee: 0.23 },
  notional: 500,
  qty: 0.25,
  stopPrice: 1980,
  takePrice: 2040,
} as const;

export const pendingTrade = (patch: Partial<Pending> = {}): Pending => ({
  ...base,
  status: 'pending',
  waitingFor: 'time',
  ...patch,
});

export const rejectedTrade = (patch: Partial<Rejected> = {}): Rejected => ({
  ...base,
  status: 'rejected',
  reason: 'capital',
  ...patch,
});

export const openTrade = (patch: Partial<Open> = {}): Open => ({
  ...base,
  ...entered,
  status: 'open',
  mark: 2010,
  unrealized: 2.27,
  markAt: T0 + 5 * MINUTE,
  valuation: 'priced',
  ...patch,
});

export const closedTrade = (patch: Partial<Closed> = {}): Closed => ({
  ...base,
  ...entered,
  status: 'closed',
  exit: { at: T0 + 9 * MINUTE, refPrice: 2040, price: 2039.6, fee: 0.24, reason: 'take-profit' },
  pnl: 9.33,
  ambiguous: false,
  dataGap: false,
  ...patch,
});

export const estimate = (patch: Partial<Estimate> = {}): Estimate => ({
  price: 2000,
  entryPrice: 2000.4,
  slippageBps: 2,
  entryFee: 0.23,
  roundTripFee: 0.46,
  stopPrice: 1980,
  takePrice: 2040,
  entryAt: T0 + MINUTE,
  exitBy: T0 + 16 * MINUTE,
  lossAtStop: 5.42,
  gainAtTake: 9.37,
  ...patch,
});

export const proposal = (patch: Partial<ChatProposal> = {}): ChatProposal => ({
  id: '0f8a3c1e-2b7d-4c55-9a61-3e2f1b0c9d84',
  version: 1,
  status: 'open',
  side: 'LONG',
  sizeUsd: 500,
  stopLossPct: 1,
  takeProfitPct: 2,
  horizon: 15,
  rationale: '',
  risk: '',
  refPrice: 2000,
  createdAt: T0 - MINUTE,
  expiresAt: T0 + 4 * MINUTE,
  origin: 'broker',
  forecastId: null,
  tradeId: null,
  estimate: estimate(),
  trade: null,
  latest: true,
  ...patch,
});

export const cycle = (patch: Partial<BookCycle> = {}): BookCycle => ({
  id: 'cycle-1',
  number: 1,
  startedAt: T0 - 60 * MINUTE,
  endedAt: null,
  startNav: 10000,
  endNav: null,
  previousEndNav: null,
  realized: 0,
  fees: 0,
  closedCount: 0,
  wins: 0,
  maxDrawdownPct: 0,
  ...patch,
});

type BookRows = Trades['user'];

export const book = (patch: Partial<BookRows> = {}): BookRows => ({
  book: 'user',
  currentCycleId: 'cycle-1',
  cycles: [cycle()],
  startNav: 10000,
  capital: 10000,
  nav: 10000,
  asOf: T0,
  realized: 0,
  unrealized: 0,
  fees: 0,
  returnPct: 0,
  maxDrawdownPct: 0,
  closedCount: 0,
  wins: 0,
  openCount: 0,
  rows: [],
  ...patch,
});

type Ticket = NonNullable<Chat['ticket']>;

export const ticket = (patch: Partial<Ticket> = {}): Ticket => ({
  minUsd: 1,
  maxUsd: 1000,
  freeUsd: 10000,
  blockedReason: null,
  stopLossPct: { min: 0.1, max: 10 },
  takeProfitPct: { min: 0.1, max: 20 },
  horizons: [5, 15, 30, 60],
  feeRate: 0.00045,
  slippageBps: 2,
  costPct: 0.13,
  ...patch,
});

export const marketChat = (patch: Partial<Chat> = {}): Chat => ({
  conversationId: null,
  seq: 0,
  key: 'xyz:GOLD',
  title: null,
  market: { coin: 'xyz:GOLD', ticker: 'GOLD', name: 'Gold', cls: 'commodities', price: 2000, change1h: 0.2 },
  items: [],
  pending: [],
  model: true,
  needsLogin: false,
  unread: 0,
  firstUnread: null,
  position: null,
  ticket: ticket(),
  latestThread: null,
  live: null,
  record: null,
  ...patch,
});
