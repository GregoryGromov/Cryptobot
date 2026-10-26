import type { Candle, TradeRow } from '@reinforce/server/dto';
import { match } from 'ts-pattern';

export type LevelKind = 'entry' | 'stop' | 'take';
type MarkerKind = 'entry' | 'exit';

export type ChartLevel = {
  readonly kind: LevelKind;
  readonly price: number;
  readonly pinned: 'above' | 'below' | null;
};

export type ChartMarker = { readonly kind: MarkerKind; readonly at: number; readonly price: number };

export type TradeChartVm =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'candles';
      readonly from: number;
      readonly to: number;
      readonly minutes: number;
      readonly domain: readonly [number, number];
      readonly levels: readonly ChartLevel[];
      readonly markers: readonly ChartMarker[];
    };

const MINUTE = 60_000;
const REACH = 0.6;
const PAD = 0.06;

const levelsOf = (trade: TradeRow): readonly { kind: LevelKind; price: number }[] =>
  match(trade)
    .with({ status: 'open' }, { status: 'closed' }, (t) => [
      { kind: 'take' as const, price: t.takePrice },
      { kind: 'entry' as const, price: t.entry.price },
      { kind: 'stop' as const, price: t.stopPrice },
    ])
    .with({ status: 'pending' }, { status: 'rejected' }, () => [])
    .exhaustive();

export const markersOf = (trade: TradeRow): readonly ChartMarker[] =>
  match(trade)
    .with({ status: 'open' }, (t) => [{ kind: 'entry' as const, at: t.entry.at, price: t.entry.price }])
    .with({ status: 'closed' }, (t) => [
      { kind: 'entry' as const, at: t.entry.at, price: t.entry.price },
      { kind: 'exit' as const, at: t.exit.at, price: t.exit.price },
    ])
    .with({ status: 'pending' }, { status: 'rejected' }, () => [])
    .exhaustive();

export const tradeChartVm = (trade: TradeRow, candles: readonly Candle[]): TradeChartVm => {
  const first = candles[0];
  const last = candles.at(-1);
  if (first === undefined || last === undefined) return { kind: 'empty' };
  const markers = markersOf(trade);
  const seen = [...candles.flatMap((c) => [c.l, c.h]), ...markers.map((m) => m.price)];
  const seenLo = Math.min(...seen);
  const seenHi = Math.max(...seen);
  const reach = (seenHi - seenLo || seenHi * 0.002) * REACH;
  const near = levelsOf(trade).filter((l) => l.price >= seenLo - reach && l.price <= seenHi + reach);
  const lo = Math.min(seenLo, ...near.map((l) => l.price));
  const hi = Math.max(seenHi, ...near.map((l) => l.price));
  const pad = (hi - lo || hi * 0.002) * PAD;
  const levels = levelsOf(trade).map(
    (level): ChartLevel => ({
      ...level,
      pinned: level.price > hi ? 'above' : level.price < lo ? 'below' : null,
    }),
  );
  return {
    kind: 'candles',
    from: first.t,
    to: last.t + MINUTE,
    minutes: Math.max(1, Math.round((last.t + MINUTE - first.t) / MINUTE)),
    domain: [lo - pad, hi + pad],
    levels,
    markers,
  };
};
