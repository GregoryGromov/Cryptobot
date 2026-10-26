import type { MarketList, SignalRow } from '@reinforce/server/dto';
import { type Direction, directionOf } from '~/shared/format/percent';

export type ListedMarket = MarketList[number]['markets'][number];

export type MarketRow = {
  readonly key: string;
  readonly coin: string;
  readonly name: string;
  readonly ticker: string;
  readonly price: number | null;
  readonly change: number | null;
  readonly direction: Direction;
  readonly spark: readonly number[];
  readonly watched: boolean;
  readonly fresh: boolean;
};

export type MarketClass = {
  readonly cls: string;
  readonly title: string;
  readonly followed: boolean;
  readonly coins: readonly string[];
};

export type MarketFilter = { readonly cls: string | undefined; readonly q: string | undefined };

export type MarketsVm = {
  readonly classes: readonly MarketClass[];
  readonly selected: MarketClass | null;
  readonly rows: readonly MarketRow[];
  readonly searching: boolean;
};

const CHANGE_DIGITS = 2;

const SHOWN_SIGNALS = 12;

export const freshCoins = (
  signals: readonly Pick<SignalRow, 'coin' | 'staleAt'>[],
  now: number,
): ReadonlySet<string> =>
  new Set(signals.filter((signal) => signal.staleAt > now).map((signal) => signal.coin));

export const marketRow = (market: ListedMarket, fresh: boolean): MarketRow => ({
  key: market.key,
  coin: market.coin,
  name: market.name,
  ticker: market.ticker,
  price: market.price,
  change: market.change1h,
  direction: market.change1h === null ? 'flat' : directionOf(market.change1h, CHANGE_DIGITS),
  spark: market.spark,
  watched: market.watched,
  fresh,
});

const needleOf = (q: string | undefined): string => (q ?? '').trim().toLocaleLowerCase();

const matches = (market: ListedMarket, needle: string): boolean =>
  needle === '' ||
  market.name.toLocaleLowerCase().includes(needle) ||
  market.ticker.toLocaleLowerCase().includes(needle);

export const marketsVm = (list: MarketList, filter: MarketFilter, fresh: ReadonlySet<string>): MarketsVm => {
  const classes = list
    .filter((group) => group.markets.length > 0)
    .map(
      (group): MarketClass => ({
        cls: group.cls,
        title: group.title,
        followed: group.markets.every((market) => market.watched),
        coins: group.markets.map((market) => market.coin),
      }),
    );
  const selected = classes.find((group) => group.cls === filter.cls) ?? null;
  const needle = needleOf(filter.q);
  const rows = list
    .filter((group) => selected === null || group.cls === selected.cls)
    .flatMap((group) => group.markets)
    .filter((market) => matches(market, needle))
    .map((market) => marketRow(market, fresh.has(market.coin)));
  return { classes, selected, rows, searching: needle !== '' };
};

export const hasMarkets = (list: MarketList): boolean => list.some((group) => group.markets.length > 0);

export const marketOf = (list: MarketList, key: string | undefined): ListedMarket | null =>
  key === undefined
    ? null
    : (list.flatMap((group) => group.markets).find((market) => market.key === key) ?? null);

export const nameOf = (list: MarketList, coin: string): string =>
  list.flatMap((group) => group.markets).find((market) => market.coin === coin)?.name ?? coin;

export const marketSignals = (items: readonly SignalRow[], coin: string): readonly SignalRow[] =>
  items
    .filter((item) => item.coin === coin)
    .toSorted((a, b) => b.eventAt - a.eventAt)
    .slice(0, SHOWN_SIGNALS);

export const watchIn = (list: MarketList, coins: readonly string[], on: boolean): MarketList =>
  list.map((group) => {
    const markets = group.markets.map((market) =>
      coins.includes(market.coin) ? { ...market, watched: on } : market,
    );
    return { ...group, markets, watched: markets.length > 0 && markets.every((market) => market.watched) };
  });

export const changedBy = (list: MarketList, coins: readonly string[], on: boolean): readonly string[] =>
  coins.filter((coin) =>
    list.some((group) => group.markets.some((market) => market.coin === coin && market.watched !== on)),
  );
