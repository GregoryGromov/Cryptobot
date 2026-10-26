import type { Figure, Scale } from '@reinforce/server/dto';
import { linearScale } from '@reinforce/ui-primitives/charts';
import { match } from 'ts-pattern';

export const MINI = { width: 80, height: 22, inset: 3, bar: 3, gap: 4, track: 2, split: 2 } as const;

type Span = { readonly x: number; readonly width: number };
type PriceFigure = Extract<Figure, { kind: 'price' }>;

export type MiniFigure =
  | {
      readonly kind: 'price';
      readonly before: string | null;
      readonly marked: string | null;
      readonly end: { readonly x: number; readonly y: number };
    }
  | {
      readonly kind: 'scale';
      readonly track: Span;
      readonly zones: readonly Span[];
      readonly from: number | null;
      readonly now: number;
    }
  | { readonly kind: 'ratio'; readonly usual: number; readonly now: number }
  | { readonly kind: 'breadth'; readonly parts: readonly (Span & { readonly key: 'up' | 'flat' | 'down' })[] }
  | {
      readonly kind: 'compare';
      readonly center: number;
      readonly bars: readonly (Span & { readonly label: string; readonly own: boolean })[];
    }
  | {
      readonly kind: 'odds';
      readonly parts: readonly (Span & { readonly cls: Outcome; readonly lead: boolean })[];
    };

type Outcome = 'UP' | 'FLAT' | 'DOWN';

const markedFrom = (figure: Pick<PriceFigure, 'closes' | 'span'>): number =>
  figure.span === null ? 0 : Math.max(0, figure.closes.length - 1 - figure.span);

export const priceMove = (figure: PriceFigure): number | null => {
  const from = figure.closes[markedFrom(figure)];
  const last = figure.closes.at(-1);
  return from === undefined || last === undefined || from === 0 ? null : (last / from - 1) * 100;
};

const priceMini = (figure: Pick<PriceFigure, 'closes' | 'span'>): MiniFigure | null => {
  const { closes } = figure;
  const last = closes.length - 1;
  const final = closes[last];
  if (last < 1 || final === undefined) return null;
  const x = linearScale([0, last], [MINI.inset, MINI.width - MINI.inset]);
  const y = linearScale([Math.min(...closes), Math.max(...closes)], [MINI.height - MINI.inset, MINI.inset]);
  const path = (from: number, to: number): string =>
    closes
      .slice(from, to + 1)
      .map((value, i) => `${i === 0 ? 'M' : 'L'}${x(from + i).toFixed(1)},${y(value).toFixed(1)}`)
      .join('');
  const cut = figure.span === null ? last : markedFrom(figure);
  return {
    kind: 'price',
    before: cut > 0 ? path(0, cut) : null,
    marked: cut < last ? path(cut, last) : null,
    end: { x: x(last), y: y(final) },
  };
};

const scaleMini = (scale: Scale): MiniFigure | null => {
  const now = scale.trail.at(-1);
  if (now === undefined) return null;
  const left = MINI.inset;
  const right = MINI.width - MINI.inset;
  const toX = linearScale([scale.min, scale.max], [left, right]);
  const x = (value: number): number => toX(Math.min(scale.max, Math.max(scale.min, value)));
  const before = scale.trail.at(-2);
  return {
    kind: 'scale',
    track: { x: left, width: right - left },
    zones: scale.zones.map((zone) => ({ x: x(zone.from), width: Math.max(0, x(zone.to) - x(zone.from)) })),
    from: before === undefined ? null : x(before.value),
    now: x(now.value),
  };
};

const ratioMini = (value: number): MiniFigure => {
  const top = Math.max(value, 1);
  const width = (share: number): number => Math.max(MINI.bar + 1, (share / top) * MINI.width);
  return { kind: 'ratio', usual: width(1), now: width(Math.max(value, 0)) };
};

const breadthMini = (figure: Extract<Figure, { kind: 'breadth' }>): MiniFigure => {
  const shares = (
    [
      { key: 'up', share: figure.up },
      { key: 'flat', share: figure.flat },
      { key: 'down', share: figure.down },
    ] as const
  ).filter((part) => part.share > 0);
  const total = shares.reduce((sum, part) => sum + part.share, 0) || 1;
  const room = MINI.width - MINI.split * Math.max(0, shares.length - 1);
  let at = 0;
  return {
    kind: 'breadth',
    parts: shares.map((part) => {
      const width = (part.share / total) * room;
      const placed = { key: part.key, x: at, width };
      at += width + MINI.split;
      return placed;
    }),
  };
};

const compareMini = (figure: Extract<Figure, { kind: 'compare' }>): MiniFigure | null => {
  if (figure.rows.length === 0) return null;
  const center = MINI.width / 2;
  const top = Math.max(...figure.rows.map((row) => Math.abs(row.value))) || 1;
  return {
    kind: 'compare',
    center,
    bars: figure.rows.map((row) => {
      const width = Math.max(1, (Math.abs(row.value) / top) * center);
      return { label: row.label, own: row.own, x: row.value < 0 ? center - width : center, width };
    }),
  };
};

export const miniFigure = (figure: Figure): MiniFigure | null =>
  match(figure)
    .with({ kind: 'price' }, priceMini)
    .with({ kind: 'scale' }, scaleMini)
    .with({ kind: 'ratio' }, (f) => ratioMini(f.value))
    .with({ kind: 'breadth' }, breadthMini)
    .with({ kind: 'compare' }, compareMini)
    .with({ kind: 'number' }, () => null)
    .exhaustive();

/** The candles a forecast was made on, as one grey line ending in a dot. */
export const candlesMini = (closes: readonly number[]): MiniFigure | null =>
  priceMini({ closes: [...closes], span: null });

/** The broker's odds on the shown term as one strip, down to up, the likeliest outcome lit. */
export const oddsMini = (
  outcomes: readonly { readonly cls: Outcome; readonly tenths: number; readonly lead: boolean }[],
): MiniFigure | null => {
  const shown = outcomes.filter((outcome) => outcome.tenths > 0);
  const total = shown.reduce((sum, outcome) => sum + outcome.tenths, 0);
  if (total === 0) return null;
  const room = MINI.width - MINI.split * (shown.length - 1);
  let at = 0;
  return {
    kind: 'odds',
    parts: shown.map((outcome) => {
      const width = (outcome.tenths / total) * room;
      const part = { x: at, width, cls: outcome.cls, lead: outcome.lead };
      at += width + MINI.split;
      return part;
    }),
  };
};

export const stackTop = (bars: number, gap: number): number =>
  (MINI.height - bars * MINI.bar - Math.max(0, bars - 1) * gap) / 2;
