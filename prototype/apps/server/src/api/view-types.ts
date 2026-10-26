import type { ForecastSubmission, Level, TradingMode } from '@reinforce/harness-contract';
import type { Locale } from '@reinforce/i18n';
/** Screen contracts retained from free-ai. These are presentation values, never execution inputs. */
export type Horizon = 5 | 15 | 30 | 60;
export type AssetClass = 'commodities' | 'stocks' | 'majors' | 'alts';
export type Cls = 'UP' | 'FLAT' | 'DOWN';
export type Side = 'LONG' | 'SHORT';
export type Cohort = 'official' | 'on-demand' | 'late' | 'non-official-timing';
export type ForecastCheckStatus =
  | 'waiting'
  | 'resolved'
  | 'unresolved-data-quality'
  | 'pending-evaluation'
  | 'not-prospective';
export type Probs = { p_up: number; p_flat: number; p_down: number };
export type MarketName = { coin: string; name: string; ticker: string; cls: AssetClass | null };
export type Quote = MarketName & { price: number | null; change1h: number | null };
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type Fill = { at: number; refPrice: number; price: number; fee: number };
type TradeBase = {
  id: string;
  cycleId: string;
  book: 'user' | 'agent';
  coin: string;
  name: string;
  side: Side;
  horizon: Horizon;
  stopLossPct: number;
  takeProfitPct: number;
  entryAt: number;
  exitDeadline: number;
  source: 'plan' | 'proposal' | 'manual';
  note: string;
  requested: number | null;
  requestedPct: number | null;
  threadId: string | null;
};
type Entered = { entry: Fill; notional: number; qty: number; stopPrice: number; takePrice: number };
export type TradeRow = TradeBase &
  (
    | { status: 'pending'; waitingFor: 'time' | 'prices' | 'execution' }
    | {
        status: 'rejected';
        reason: 'capital' | 'wrong-instrument' | 'invalid-levels';
      }
    | (Entered & {
        status: 'open';
        mark: number | null;
        unrealized: number | null;
        markAt: number | null;
        valuation: 'priced' | 'awaiting-prices' | 'awaiting-settlement';
      })
    | (Entered & {
        status: 'closed';
        exit: Fill & { reason: 'stop-loss' | 'take-profit' | 'time' | 'data-gap' | 'bankruptcy' };
        pnl: number;
        ambiguous: boolean;
        dataGap: boolean;
      })
  );
export type BookCycle = {
  id: string;
  number: number;
  startedAt: number;
  endedAt: number | null;
  startNav: number;
  endNav: number | null;
  previousEndNav: number | null;
  realized: number;
  fees: number;
  closedCount: number;
  wins: number;
  maxDrawdownPct: number;
};
export type Book = {
  book: 'user' | 'agent';
  currentCycleId: string | null;
  cycles: BookCycle[];
  startNav: number;
  capital: number;
  nav: number | null;
  asOf: number | null;
  realized: number;
  unrealized: number | null;
  fees: number;
  returnPct: number | null;
  maxDrawdownPct: number;
  closedCount: number;
  wins: number;
  openCount: number;
};
export type Trades = { user: Book & { rows: TradeRow[] }; agent: Book & { rows: TradeRow[] } };
export type UiPreferences = {
  classes: AssetClass[];
  markets: string[];
  mode: TradingMode;
  maxTradeUsd: number;
  analysisLimit: number;
  ideaLimit: number;
  autoAnalysis: boolean;
  alerts: boolean;
  actionableOnly: boolean;
  quiet: { on: boolean; from: number; to: number; tz: string };
  style: string;
};
export type MarketStatus = {
  phase: 'loading' | 'ready' | 'stale' | 'unavailable';
  lastBarEnd: number | null;
  message: string | null;
  loaded: number;
  total: number;
};
export type Pulse = {
  accountId: string | null;
  now: number;
  telegramLinkId: string | null;
  /** By topic: the conversation's next sequence number. */
  conversations: Record<string, number>;
  market: MarketStatus;
};
/**
 * How far the broker has written an analysis, keyed by what it answers: the step he is at, and what of it is written in
 * full. The steps come in this order and follow the model, not a clock.
 */
export type AnalysisProgress = {
  id: string;
  stage: 'reading' | 'odds' | 'plan' | 'reasons';
  odds: { horizon: Horizon; probs: Probs; expected: number; q10: number; q50: number; q90: number }[];
  plan: { action: Side | 'FLAT'; horizon: Horizon } | null;
  headline: string | null;
  thesis: string | null;
};
export type ConversationEvent =
  | { kind: 'entries'; latest: number }
  | { kind: 'draft'; draft: { runId: string; sourceId: string; text: string } | null }
  | { kind: 'analysis'; progress: AnalysisProgress[] };
export type Session = {
  environment: 'live' | 'replay';
  /** The language the server answered in: the device's choice, else the account's, else the browser's. */
  locale: Locale;
  user: { name: string; guest: boolean };
  /** `ownModelAvailable`: a signed-in user's own Grok may answer here instead of the platform's. */
  auth: { xaiAvailable: boolean; ownModelAvailable: boolean };
  model: boolean;
  /** Whose model answers: `own` is whether the user's is connected, `route` which of the two is chosen. */
  ai: {
    own: boolean;
    route: 'own' | 'free';
    free: { left: number; limit: number; resetAt: number };
  };
  agent: { id: string };
  balance: { nav: number | null; returnPct: number | null };
  connection: { provider: 'xai' | 'scripted'; model: string };
  version: {
    id: string;
    n: number;
    model: 'grok' | 'scripted';
    harness: string;
    harnessKind: 'builtin' | 'custom' | 'external';
  } | null;
  preferences: UiPreferences;
  telegram: { linked: boolean; username: string | null; bot: string | null; available: boolean };
  market: MarketStatus & { instruments: MarketName[] };
  classes: { cls: AssetClass; title: string }[];
  rules: {
    detector: { profile: string; version: string; robustZ: number | null };
    tauPct: Record<Horizon, number>;
    execution: {
      version: string;
      feeRate: number;
      slippageBps: { high: number; medium: number; lower: number };
      funding: 'DISABLED';
      startNav: number;
    };
    t0OffsetSeconds: number;
    customRuntime: 'cloudflare' | 'local-process' | null;
  };
};
type Verdict = { horizon: Horizon; probs: Probs; action: Side | 'FLAT' };
/** One horizon of a forecast in a conversation: the odds, where the price is expected, and how it was borne out. */
export type HorizonNote = {
  horizon: Horizon;
  probs: Probs;
  expected: number;
  q10: number;
  q50: number;
  q90: number;
  /** The flat band of this horizon, in percent either way: a smaller move counts as «боковик». */
  tau: number;
  checkAt: number;
  checkStatus: ForecastCheckStatus;
  checked: { returnPct: number; cls: Cls | null } | null;
  note: string | null;
};
/**
 * A fixed forecast as the conversation shows it: the broker's call over all four horizons, his words, how many points
 * he gave each way, where he would change his mind, and his trade plan. The points themselves are fetched on demand.
 */
export type ForecastNote = {
  id: string;
  threadId: string;
  coin: string;
  at: number;
  t0: number;
  /** The price the forecast is measured from; before the first check, the snapshot's last close. */
  p0: number | null;
  cohort: Cohort;
  version: number | null;
  headline: string;
  thesis: string;
  horizons: HorizonNote[];
  plan: TradePlanNote;
  points: { stance: 'up' | 'down' | 'flat' | 'risk'; weight: 'high' | 'medium' | 'low' }[];
  invalidation: { when: 'below' | 'above'; level: Level; price: number } | null;
  mark: { label: string; price: number } | null;
};
export type TradePlanNote =
  | { action: 'FLAT'; horizon: Horizon }
  | { action: Side; horizon: Horizon; sizePct: number; stopPct: number; targetPct: number };
export type SignalView = {
  eventId: string;
  eventAt: number;
  staleAt: number;
  move: number;
  horizon: 5 | 15 | 30;
  direction: 'UP' | 'DOWN';
  scope: 'IDIOSYNCRATIC' | 'BROAD' | 'MARKET_WIDE' | 'UNKNOWN';
  volumeConfirmed: boolean;
  times: number | null;
  spark: { before: number; after: number; values: number[]; at: number } | null;
};
export type SignalRow = SignalView &
  Quote & { chat: string; since: number | null; asked: boolean; threadId: string | null };
/** No signal for an hour: the markets that moved most over it, as moves, not signals. */
type Quiet = {
  kind: 'quiet';
  loading: boolean;
  markets: number;
  movers: (MarketName & { chat: string; change1h: number; spark: number[] })[];
};
export type Signals = { items: SignalRow[]; quiet: Quiet | null };
export type LiveSignal =
  | Quiet
  | (SignalRow & { kind: 'signal'; view: { text: string; forecast: ForecastNote } | null });
/**
 * A market over its day and against its usual: the change and dollars traded over 24 hours, the last half hour's volume
 * and swings as multiples of their usual size, and, live, the exchange's hourly funding and open interest. Null when
 * unknown: the stored minutes do not reach a day back, the state is not fresh, or the exchange did not answer.
 */
export type MarketDay = {
  change24h: number | null;
  volume24h: number | null;
  volumeVsUsual: number | null;
  swingsVsUsual: number | null;
  funding: number | null;
  openInterest: number | null;
};
export type Catalog = {
  cls: AssetClass;
  title: string;
  watched: boolean;
  markets: (Quote & MarketDay & { key: string; spark: number[]; watched: boolean })[];
}[];
/**
 * What the broker makes of a market now: his latest forecast there, his own trade open on it, and whether he is at it
 * this minute. A market he has not looked at has none of them.
 */
export type MarketOpinion = {
  forecast: (Verdict & { at: number; checkAt: number }) | null;
  trade: { side: Side; pnl: number | null } | null;
  busy: boolean;
};
/** The markets as the page «Рынки» shows them: the catalog with the broker's opinion of each market. */
export type MarketList = (Omit<Catalog[number], 'markets'> & {
  markets: (Catalog[number]['markets'][number] & { opinion: MarketOpinion })[];
})[];
type ProposalStatus = 'open' | 'confirmed' | 'skipped' | 'expired' | 'superseded';
export type ProposalView = {
  id: string;
  version: number;
  status: ProposalStatus;
  side: Side;
  sizeUsd: number;
  stopLossPct: number;
  takeProfitPct: number;
  horizon: Horizon;
  rationale: string;
  risk: string;
  refPrice: number | null;
  createdAt: number;
  expiresAt: number;
  origin: 'broker' | 'plan' | 'lean';
  forecastId: string | null;
  tradeId: string | null;
};
export type Estimate = {
  price: number;
  entryPrice: number;
  slippageBps: number;
  entryFee: number;
  roundTripFee: number;
  stopPrice: number;
  takePrice: number;
  entryAt: number;
  exitBy: number;
  lossAtStop: number;
  gainAtTake: number;
};
export type Review = { proposal: ProposalView; estimate: Estimate };
export type ChatProposal = ProposalView & {
  estimate: Estimate | null;
  trade: TradeRow | null;
  latest: boolean;
};
export type ChatMessage = {
  kind: 'message';
  key: string;
  at: number;
  role: 'user' | 'broker' | 'system';
  text: string;
  /** The request a person's words were sent with, so the page that sent them finds them; null on others. */
  requestId: string | null;
  /** The questions the broker expects next, in the person's words; only on his own answers. */
  followUps: string[];
  /** The stretch of the market's chart a person asked about; only on their own words. */
  span: { from: number; to: number } | null;
  channel: 'web' | 'telegram' | 'platform';
  threadId: string;
  forecast: ForecastNote | null;
  signal: SignalView | null;
  proposal: ChatProposal | null;
  tradeId: string | null;
  options:
    | {
        label: string;
        text: string;
        classes: AssetClass[] | null;
        chat: string | null;
        glance: { markets: { name: string; change1h: number | null }[]; spark: number[]; up: boolean } | null;
      }[]
    | null;
  /** Markets an answer in the general conversation is about, and the question it answered, to go on with there. */
  handoff: { markets: string[]; question: string | null } | null;
};
export type ChatItem =
  | ChatMessage
  | (SignalView & { kind: 'signal'; key: string; at: number })
  | {
      kind: 'check';
      key: string;
      forecastId: string;
      at: number;
      horizon: Horizon;
      returnPct: number | null;
      cls: Cls | null;
      lean: Cls | null;
      cohort: Cohort;
    }
  | {
      kind: 'failed';
      key: string;
      at: number;
      runId: string;
      runKind: 'forecast' | 'converse';
      error: string | null;
      retry: boolean;
    }
  | (MarketName & {
      kind: 'mention';
      key: string;
      at: number;
      chat: string;
      text: string | null;
      idea: (Verdict & { side: Side; sizeUsd: number; status: ProposalStatus }) | null;
    });
export type Chat = {
  conversationId: string | null;
  seq: number;
  key: string;
  title: string | null;
  market: Quote | null;
  items: ChatItem[];
  pending: {
    id: string;
    kind: 'forecast' | 'converse';
    /** An analysis's moment it forecasts from; null for an answer. */
    t0: number | null;
    deadline: number | null;
    since: number;
    attempt: number;
  }[];
  model: boolean;
  needsLogin: boolean;
  unread: number;
  /** The first entry the reader had not seen yet, where the line that marks what is new stands. */
  firstUnread: string | null;
  position: TradeRow | null;
  ticket: {
    minUsd: number;
    maxUsd: number;
    freeUsd: number;
    blockedReason: 'account-busy' | 'capital' | null;
    stopLossPct: { min: number; max: number };
    takeProfitPct: { min: number; max: number };
    horizons: readonly Horizon[];
    feeRate: number;
    slippageBps: number;
    costPct: number;
  } | null;
  latestThread: string | null;
  live: LiveSignal | null;
  record: {
    official: { horizon: Horizon; n: number; provisional: boolean; skill: number | null }[];
    onDemand: { horizon: Horizon; n: number; provisional: boolean; skill: number | null }[];
  } | null;
};
export type Preview =
  | { kind: 'signal'; at: number; move: number; horizon: 5 | 15 | 30; direction: 'UP' | 'DOWN' }
  | (Verdict & { kind: 'forecast'; at: number; proposal: { side: Side; sizeUsd: number } | null })
  | { kind: 'proposal'; at: number; side: Side; sizeUsd: number }
  | { kind: 'text'; at: number; role: 'user' | 'broker' | 'system'; text: string }
  | { kind: 'busy'; at: number };
type ChatSummary = { key: string; preview: Preview | null; at: number; unread: number; spoken: boolean };
export type Chats = {
  status: { text: string; settings: boolean } | null;
  lastSignalAt: number | null;
  broker: ChatSummary;
  talks: (ChatSummary & { title: string })[];
  markets: (ChatSummary &
    Quote & { watched: boolean; position: { side: Side; pnl: number | null } | null })[];
};
export type ChatRow = Chats['broker'] | Chats['talks'][number] | Chats['markets'][number];
export type ForecastView = {
  id: string;
  coin: string;
  cohort: Cohort;
  stateId: string;
  receivedAt: number;
  t0: number;
  deadline: number | null;
  origin: 'event' | 'request' | 'first-run' | null;
  refines: string | null;
  versionId: string;
  versionN: number | null;
  runtime: 'external' | 'local' | 'local-process' | 'cloudflare';
  attestation: 'platform-verified' | 'user-declared';
  p0: number | null;
  stateClose: number | null;
  forecasts: {
    horizon: Horizon;
    probs: Probs;
    expected: number;
    q: { q10: number; q50: number; q90: number };
    checkAt: number;
    reference: (Probs & { n: number }) | null;
    result:
      | {
          status: 'resolved';
          returnPct: number;
          cls: Cls;
          brier: number;
          brierRef: number | null;
          inInterval: boolean;
        }
      | {
          status: 'unresolved-data-quality' | 'pending-evaluation' | 'not-prospective';
          returnPct: null;
          cls: null;
          brier: null;
          brierRef: null;
          inInterval: null;
        }
      | null;
  }[];
  plan: {
    action: Side | 'FLAT';
    selected_horizon_minutes: Horizon;
    position_size_pct_nav: number;
    stop_loss_pct: number | null;
    take_profit_pct: number | null;
  };
  /** The explanation, for a forecast told in the current protocol; one recorded in an older one has none. */
  rationale: ForecastSubmission['rationale'] | null;
  /** The prices the levels name, as the snapshot gave them: what a line «передумает ниже…» or a mark is drawn at. */
  levels: Partial<Record<Level, number>>;
};
export type ThreadView = MarketName & {
  id: string;
  chat: string;
  origin: 'event' | 'request' | 'lobby';
  createdAt: number;
  event:
    | (MarketName & {
        id: string;
        at: number;
        direction: 'UP' | 'DOWN';
        move: number;
        horizon: 5 | 15 | 30;
        triggered: number[];
        severity: string;
        scope: SignalView['scope'];
        volumeConfirmed: boolean;
      })
    | null;
  anchor: number;
  price: number | null;
  costPct: number;
  latestBarEnd: number | null;
  forecasts: ForecastView[];
  proposals: ProposalView[];
  messages: {
    id: string;
    role: ChatMessage['role'];
    text: string;
    at: number;
    channel: ChatMessage['channel'];
    forecastId: string | null;
    proposalId: string | null;
    runId: string | null;
  }[];
  runs: {
    id: string;
    kind: 'forecast' | 'converse';
    status: string;
    createdAt: number;
    error: { code: string; message: string } | null;
    messageId: string | null;
    deadline: number | null;
  }[];
  agentTrades: TradeRow[];
  userTrades: TradeRow[];
};
export type Journal = (ForecastView & { threadId: string | null })[];
export type HorizonQuality = {
  horizon: Horizon;
  n: number;
  provisional: boolean;
  brier: number | null;
  brierRef: number | null;
  skill: number | null;
  mae: number | null;
  pinball: number | null;
  coverage: number | null;
};
export type Quality = {
  cohort: Cohort;
  horizons: HorizonQuality[];
  calibration: { level: number; n: number; observed: number | null }[];
  forecasts: number;
  dispatched: number;
  coverage: number | null;
};
export type AgentView = {
  templatePrompt: string;
  availableModels: string[];
  books: { agent: Book; user: Book };
  quality: { official: Quality; onDemand: Quality; late: Quality };
  scorecard: {
    forecasts: number;
    terms: { horizon: Horizon; n: number; hits: number }[];
    n: number;
    hits: number;
    marketHits: number;
    marketN: number;
    official: { n: number; hits: number };
    pending: number;
    unresolved: number;
    notProspective: number;
    nextCheckAt: number | null;
  };
  versions: {
    id: string;
    n: number;
    active: boolean;
    prompt: string;
    model: 'grok' | 'scripted';
    modelId: string;
    harness: string;
    harnessKind: 'builtin' | 'custom' | 'external';
    externalUrl: string | null;
    code: string | null;
    note: string;
    createdAt: number;
    forecasts: number;
    skill15: number | null;
    n15: number;
  }[];
  horizons: readonly Horizon[];
};
/** A message found by its words: the topic it was said in, and the line around the words with their place in it. */
export type SearchHit = {
  id: string;
  topic: string;
  at: number;
  role: 'user' | 'broker';
  text: string;
  start: number;
  length: number;
};
