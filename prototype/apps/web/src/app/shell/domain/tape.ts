import type { MarketList, SignalRow } from '@reinforce/server/dto';

export type TapeQuote = {
  readonly key: string;
  readonly coin: string;
  readonly ticker: string;
  readonly name: string;
  readonly price: number;
  readonly change1h: number | null;
};

export const tapeQuotesOf = (catalog: MarketList): readonly TapeQuote[] => {
  const seen = new Set<string>();
  const quotes: TapeQuote[] = [];
  for (const market of catalog.flatMap((group) => group.markets)) {
    // A market whose hour is not whole yet still runs, without its change: the run keeps its length and pace.
    if (market.price === null || seen.has(market.coin)) continue;
    seen.add(market.coin);
    quotes.push({
      key: market.key,
      coin: market.coin,
      ticker: market.ticker,
      name: market.name,
      price: market.price,
      change1h: market.change1h,
    });
  }
  return quotes;
};

export const freshCoinsOf = (
  signals: readonly Pick<SignalRow, 'coin' | 'staleAt'>[],
  now: number,
): ReadonlySet<string> =>
  new Set(signals.filter((signal) => signal.staleAt > now).map((signal) => signal.coin));

export const tapeCopiesOf = (count: number): number => (count < 8 ? 4 : 2);
