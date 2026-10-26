import { type Horizon, MODE_HORIZON } from '@reinforce/harness-contract';
import type { Locale } from '@reinforce/i18n/server';
import * as broker from '../../modules/broker/index.js';
import * as forecast from '../../modules/forecast/index.js';
import type { Deps } from '../../workflows/deps.js';
import type { MarketList, MarketOpinion } from '../view-types.js';
import { probs } from './forecasts.js';
import { marketOverview } from './market.js';
import { portfolioView } from './portfolio.js';

const NONE: MarketOpinion = { forecast: null, trade: null, busy: false };

/**
 * Every market the broker can talk about, by class, with what he makes of each now. The page «Рынки» is about where
 * the broker stands, not about what happened: the signals have their own page.
 */
export async function catalogView(
  deps: Deps,
  userId: string | undefined,
  locale: Locale,
): Promise<MarketList> {
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  const prefs = personal
    ? (await broker.loadHead(deps.db, personal.id)).preferences
    : broker.defaultPreferences();
  const { catalog } = await marketOverview(deps, locale, prefs.markets);
  const opinions =
    personal && userId
      ? await opinionsOf(deps, personal.id, userId, locale, MODE_HORIZON[prefs.mode])
      : new Map();
  return catalog.map((c) => ({
    ...c,
    markets: c.markets.map((m) => ({ ...m, opinion: opinions.get(m.coin) ?? NONE })),
  }));
}

/**
 * The broker's opinion by market: his latest forecast there with the verdict on the horizon the person trades, his own
 * trade open on it, and whether a request or a signal there still waits for his answer.
 */
async function opinionsOf(
  deps: Deps,
  brokerId: string,
  userId: string,
  locale: Locale,
  horizon: Horizon,
): Promise<Map<string, MarketOpinion>> {
  const [dispatches, forecasts, trades] = await Promise.all([
    forecast.listDispatches(deps.db, brokerId),
    forecast.listBrokerForecasts(deps.db, brokerId),
    portfolioView(deps, userId, locale),
  ]);
  const now = deps.clock.now();
  const out = new Map<string, MarketOpinion>();
  const of = (coin: string): MarketOpinion => {
    const known = out.get(coin);
    if (known) return known;
    const fresh = { ...NONE };
    out.set(coin, fresh);
    return fresh;
  };
  const byId = new Map(dispatches.map((d) => [d.id, d]));
  // The forecasts come newest first: the first one of a market is its latest.
  for (const f of forecasts) {
    const d = byId.get(f.dispatchId);
    if (!d || of(d.instrument).forecast) continue;
    const plan = f.body.trade;
    const h = f.body.horizons.find((x) => x.horizon === horizon);
    if (!h) continue;
    of(d.instrument).forecast = {
      horizon: h.horizon,
      probs: probs(h.probabilities),
      action: plan.horizon === horizon ? plan.action : 'FLAT',
      at: f.receivedAt,
      checkAt: d.t0 + h.horizon * 60000,
    };
  }
  const answered = new Set(forecasts.map((f) => f.dispatchId));
  for (const d of dispatches) if (!answered.has(d.id) && d.deadline > now) of(d.instrument).busy = true;
  for (const r of trades.agent.rows)
    if (r.status === 'open') of(r.coin).trade = { side: r.side, pnl: r.unrealized };
  return out;
}
