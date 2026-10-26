import { numberAt, valueAt } from '@reinforce/harness-contract';
import { known, type Locale, translator } from '@reinforce/i18n/server';
import { D } from '../../kernel/money.js';
import { MINUTE, minuteFloor } from '../../kernel/time.js';
import * as market from '../../modules/market/index.js';
import { usesHttpMarket } from '../../platform/config.js';
import type { Deps } from '../../workflows/deps.js';
import type {
  AssetClass,
  Catalog,
  MarketDay,
  MarketName,
  Quote,
  Session,
  SignalView,
} from '../view-types.js';

const CLASSES: AssetClass[] = ['majors', 'alts', 'commodities', 'stocks'];
export const classes = (locale: Locale): { cls: AssetClass; title: string }[] =>
  CLASSES.map((cls) => ({ cls, title: translator(locale)(`market.classes.${cls}`) }));
export function marketName(coin: string, locale: Locale): MarketName {
  const ticker = coin.replace(/^xyz:/, '');
  const commodity = ['GOLD', 'SILVER', 'CL', 'OIL'].includes(ticker);
  const cls: AssetClass = commodity
    ? 'commodities'
    : coin.startsWith('xyz:')
      ? 'stocks'
      : ['BTC', 'ETH'].includes(coin)
        ? 'majors'
        : 'alts';
  return {
    coin,
    ticker,
    name: known(translator(locale)('market.names', { returnObjects: true }), ticker) ?? ticker,
    cls,
  };
}
export async function quote(
  deps: Deps,
  coin: string,
  locale: Locale,
): Promise<Quote & { spark: number[]; lastBarEnd: number | null }> {
  const until = minuteFloor(deps.clock.now());
  // Upstream stores candles minutes late, so the hour is counted back from the latest candle rather than from now.
  const rows = await market.loadCandles(deps.db, coin, until - 61 * MINUTE - market.LIVE_STATE_AGE, until);
  const latest = rows.at(-1)?.candle;
  const hour = latest ? rows.filter((row) => row.candle.openAt >= latest.openAt - 60 * MINUTE) : [];
  // The price an hour back is the close of the last minute traded by then: a quiet minute has no candle of its own.
  const first = latest
    ? rows.findLast((row) => row.candle.openAt <= latest.openAt - 60 * MINUTE)?.candle
    : undefined;
  return {
    ...marketName(coin, locale),
    price: latest ? Number(latest.close) : null,
    change1h: first && latest ? new D(latest.close).div(first.close).minus(1).mul(100).toNumber() : null,
    spark: hour.map((row) => Number(row.candle.close)),
    lastBarEnd: latest ? latest.openAt + MINUTE : null,
  };
}
const DAY = 1440 * MINUTE;
// A day's numbers stand when the stored minutes reach that far back, give or take a few quiet minutes.
const DAY_SLACK = 15 * MINUTE;
// A market's state compared with its usual is shown while it is this fresh.
const USUAL_AGE = 15 * MINUTE;
const NO_DAY: MarketDay = {
  change24h: null,
  volume24h: null,
  volumeVsUsual: null,
  swingsVsUsual: null,
  funding: null,
  openInterest: null,
};

// The day's totals change once a minute and every page asks for them: one read per database and minute.
const totalsRead = new WeakMap<object, { key: string; rows: ReturnType<typeof market.minuteTotals> }>();
function dayTotals(deps: Deps, coins: readonly string[], to: number) {
  const key = `${to}|${[...coins].sort().join(',')}`;
  const hit = totalsRead.get(deps.db);
  if (hit?.key === key) return hit.rows;
  const rows = market.minuteTotals(deps.db, coins, to - DAY, to);
  totalsRead.set(deps.db, { key, rows });
  rows.catch(() => totalsRead.delete(deps.db));
  return rows;
}

/** A state's volume and swings over the last half hour as multiples of their usual size. */
function usualOf(snapshot: market.Snapshot | undefined, now: number) {
  if (snapshot?.quality !== 'valid' || now - snapshot.cutoffAt > USUAL_AGE)
    return { volumeVsUsual: null, swingsVsUsual: null };
  const body = valueAt(snapshot.body, 'numeric_state').value ?? snapshot.body;
  const positive = (x: number | null) => (x !== null && x > 0 ? x : null);
  return {
    volumeVsUsual: positive(numberAt(body, 'engineered_features.activity_anomaly.volume_vs_7d_median_30m')),
    swingsVsUsual: positive(numberAt(body, 'engineered_features.volatility_regime.rv_regime_ratio_30m')),
  };
}

/** Each market over its day and against its usual, from the stored minutes and states; live, from the exchange too. */
async function marketDays(
  deps: Deps,
  coins: readonly string[],
  snapshots: readonly market.Snapshot[],
): Promise<Map<string, MarketDay>> {
  const now = deps.clock.now();
  const to = minuteFloor(now);
  const [totals, exchange] = await Promise.all([
    dayTotals(deps, coins, to),
    deps.exchangeStats?.stats(coins, deps.shutdown) ?? new Map(),
  ]);
  return new Map(
    coins.map((coin): [string, MarketDay] => {
      const stored = totals.find((row) => row.instrument === coin && row.firstAt <= to - DAY + DAY_SLACK);
      const live = exchange.get(coin);
      return [
        coin,
        {
          ...usualOf(
            snapshots.find((s) => s.instrument === coin),
            now,
          ),
          change24h:
            live?.dayChange ??
            (stored && Number(stored.open) > 0
              ? new D(stored.close).div(stored.open).minus(1).mul(100).toNumber()
              : null),
          volume24h: live?.dayVolumeUsd ?? (stored ? Number(stored.traded) : null),
          funding: live?.funding ?? null,
          openInterest: live?.openInterestUsd ?? null,
        },
      ];
    }),
  );
}

export async function marketOverview(deps: Deps, locale: Locale, watched: readonly string[] = []) {
  const t = translator(locale);
  const snapshots = await market.latestSnapshots(deps.db);
  const live = usesHttpMarket(deps.config);
  const sourceCatalog = live ? await market.loadCatalog(deps.db) : undefined;
  const observations = live && watched.length ? await market.currentObservations(deps.db) : [];
  // Live markets are the catalog's universe: only those are read every minute. A market that left it keeps its
  // past signals but no prices, so it stays only in the list of a person who follows it.
  const universe = sourceCatalog?.body.instruments.filter((i) => i.in_universe).map((i) => i.exchange_symbol);
  const coins = [...new Set([...(universe ?? snapshots.map((s) => s.instrument)), ...watched])];
  const [quotes, days] = await Promise.all([
    Promise.all(coins.map((coin) => quote(deps, coin, locale))),
    marketDays(deps, coins, snapshots),
  ]);
  const lastBarEnd =
    Math.max(0, ...snapshots.map((s) => s.cutoffAt), ...quotes.map((q) => q.lastBarEnd ?? 0)) || null;
  let phase: Session['market']['phase'] = !snapshots.length
    ? 'loading'
    : lastBarEnd !== null && deps.clock.now() - lastBarEnd <= 3 * MINUTE
      ? 'ready'
      : 'stale';
  let loaded = snapshots.filter((s) => s.quality === 'valid').length;
  if (live) {
    const now = deps.clock.now();
    // Prices come from candles of every market on show. Upstream stores them in batches minutes apart and a quiet
    // minute leaves one market behind, so the market is current while most of it is within a served state's age,
    // and still loading while nothing is old.
    const fresh = quotes.filter(
      (q) => q.lastBarEnd !== null && now - q.lastBarEnd <= market.LIVE_STATE_AGE,
    ).length;
    const empty = quotes.filter((q) => q.lastBarEnd === null).length;
    loaded = coins.length - empty;
    phase =
      coins.length && fresh * 2 >= coins.length
        ? 'ready'
        : !coins.length || fresh + empty === coins.length
          ? 'loading'
          : 'stale';
    // The markets a person follows are read as computed states, whose own freshness is known.
    const current = [...new Set(watched)].map((instrument) =>
      observations.find((o) => o.instrument === instrument),
    );
    if (current.some((o) => o?.status === 'ERROR' || o?.status === 'UNAVAILABLE')) phase = 'unavailable';
    else if (
      phase === 'ready' &&
      current.some(
        (o) =>
          o &&
          !(
            market.usableObservation(o, now) &&
            snapshots.some((s) => s.id === o.snapshotId && now - s.cutoffAt <= market.LIVE_STATE_AGE)
          ),
      )
    )
      phase = 'stale';
  }
  const state: Session['market'] = {
    phase,
    lastBarEnd,
    loaded,
    total: coins.length,
    message:
      deps.config.MARKET_MODE === 'replay'
        ? deps.config.REPLAY_SOURCE === 'atp-demo'
          ? phase === 'ready'
            ? t('market.status.atpDemo')
            : t('market.status.atpDemoOver')
          : t('market.status.replay')
        : phase === 'stale'
          ? t('market.status.stale')
          : phase === 'unavailable'
            ? t('market.status.unavailable')
            : null,
    instruments: coins.map((coin) => marketName(coin, locale)),
  };
  const catalog: Catalog = classes(locale).map(({ cls, title }) => ({
    cls,
    title,
    watched:
      quotes.some((q) => q.cls === cls) &&
      quotes.filter((q) => q.cls === cls).every((q) => watched.includes(q.coin)),
    markets: quotes
      .filter((q) => q.cls === cls)
      .map((q) => ({
        ...q,
        ...(days.get(q.coin) ?? NO_DAY),
        key: q.coin,
        watched: watched.includes(q.coin),
      })),
  }));
  return { state, catalog, quotes };
}
export { chart } from '../../workflows/chart-candles.js';
export function signalView(event: market.MarketEvent): SignalView | null {
  const body = event.body;
  // Metadata must be present in the upstream event; an absent move is not a zero-percent signal.
  if (
    typeof body.movePct !== 'number' ||
    !Number.isFinite(body.movePct) ||
    ![5, 15, 30].includes(Number(body.horizon))
  )
    return null;
  const horizon = body.horizon as 5 | 15 | 30;
  return {
    eventId: event.id,
    eventAt: event.barEnd,
    staleAt: event.barEnd + 15 * MINUTE,
    move: body.movePct,
    horizon,
    direction: body.movePct >= 0 ? 'UP' : 'DOWN',
    scope: ['IDIOSYNCRATIC', 'BROAD', 'MARKET_WIDE'].includes(String(body.scope))
      ? (body.scope as SignalView['scope'])
      : 'UNKNOWN',
    volumeConfirmed: body.volumeConfirmed === true,
    times: typeof body.times === 'number' ? body.times : null,
    spark: null,
  };
}
/** The minutes of a signal's price line: before the event and after it. */
const SPARK = { before: 40, after: 20 };
/**
 * The price around a signal: closing prices from forty minutes before the event to twenty after, with the event's
 * place among them. The window is the same for every signal, so its moment stands at the same place on every line.
 * A missing minute leaves no line rather than one drawn across the gap.
 */
export async function signalSpark(deps: Deps, event: market.MarketEvent): Promise<SignalView['spark']> {
  const candles = await market.loadCandles(
    deps.db,
    event.instrument,
    event.barEnd - SPARK.before * MINUTE,
    Math.min(minuteFloor(deps.clock.now()), event.barEnd + SPARK.after * MINUTE),
  );
  const at = candles.findIndex((row) => row.candle.openAt === event.barEnd - MINUTE);
  const whole = candles.every(
    (row, i) => i === 0 || row.candle.openAt === (candles[i - 1]?.candle.openAt ?? 0) + MINUTE,
  );
  return at > 0 && whole ? { ...SPARK, values: candles.map((row) => Number(row.candle.close)), at } : null;
}
/** How far the price has gone since a signal, in percent; unknown without the minute the signal closed on. */
export const sinceSignal = (spark: SignalView['spark'], price: number | null): number | null => {
  const then = spark?.values[spark.at];
  return price !== null && then ? (price / then - 1) * 100 : null;
};
