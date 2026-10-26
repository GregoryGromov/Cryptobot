import type { Figure, Scale } from '@reinforce/server/dto';
import { linearScale } from '@reinforce/ui-primitives/charts';

export type Tone = Scale['zones'][number]['tone'];

export const TRACK = { inset: 6, bar: 5, plain: 26, labelled: 56, center: 12, labelledCenter: 32 } as const;

export type TrackGeometry = {
  readonly height: number;
  readonly center: number;
  readonly left: number;
  readonly right: number;
  readonly zones: readonly { readonly x: number; readonly width: number; readonly tone: Tone }[];
  readonly range: { readonly x: number; readonly width: number } | null;
  readonly trail: readonly {
    readonly label: string;
    readonly value: number;
    readonly x: number;
    readonly last: boolean;
  }[];
  readonly line: string | null;
};

export const scaleDigits = (scale: Pick<Scale, 'min' | 'max'>): number =>
  Math.abs(scale.max - scale.min) <= 2 ? 2 : 0;

export const trackGeometry = (scale: Scale, width: number, labelled: boolean): TrackGeometry => {
  const left = TRACK.inset;
  const right = Math.max(width - TRACK.inset, left + 1);
  const toX = linearScale([scale.min, scale.max], [left, right]);
  const x = (value: number) => toX(Math.min(scale.max, Math.max(scale.min, value)));
  const center = labelled ? TRACK.labelledCenter : TRACK.center;
  const trail = scale.trail.map((point, i) => ({
    label: point.label,
    value: point.value,
    x: x(point.value),
    last: i === scale.trail.length - 1,
  }));
  return {
    height: labelled ? TRACK.labelled : TRACK.plain,
    center,
    left,
    right,
    zones: scale.zones.map((zone) => ({
      x: x(zone.from),
      width: Math.max(0, x(zone.to) - x(zone.from)),
      tone: zone.tone,
    })),
    range: scale.range
      ? { x: x(scale.range[0]), width: Math.max(2, x(scale.range[1]) - x(scale.range[0])) }
      : null,
    trail,
    line:
      trail.length > 1
        ? trail.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${center}`).join('')
        : null,
  };
};

export const RATIO = { label: 96, gutter: 56, usualY: 8, nowY: 37, bar: 12, height: 58 } as const;

export const ratioGeometry = (value: number, width: number) => {
  const max = Math.max(value, 1) * 1.08;
  const right = Math.max(width - RATIO.gutter, RATIO.label + 1);
  const x = linearScale([0, max], [RATIO.label, right]);
  return {
    usual: x(1) - RATIO.label,
    now: Math.max(2, x(value) - RATIO.label),
    usualEnd: x(1),
    nowEnd: x(value),
  };
};

export type BreadthPart = {
  readonly key: 'up' | 'flat' | 'down';
  readonly share: number;
  readonly count: number | null;
  readonly x: number;
  readonly width: number;
};

const BREADTH_GAP = 2;

export const breadthParts = (
  figure: Extract<Figure, { kind: 'breadth' }>,
  width: number,
): readonly BreadthPart[] => {
  const shares = [
    { key: 'up', share: figure.up },
    { key: 'flat', share: figure.flat },
    { key: 'down', share: figure.down },
  ] as const;
  const total = shares.reduce((sum, p) => sum + p.share, 0) || 1;
  let at = 0;
  return shares.map((p) => {
    const w = Math.max(0, (p.share / total) * width - BREADTH_GAP);
    const part = {
      key: p.key,
      share: p.share,
      count: figure.total === null ? null : Math.round(p.share * figure.total),
      x: at,
      width: w,
    };
    at += w + BREADTH_GAP;
    return part;
  });
};

export type CompareBar = {
  readonly label: string;
  readonly coin: string | null;
  readonly value: number;
  readonly own: boolean;
  readonly share: number;
};

export const compareBars = (figure: Extract<Figure, { kind: 'compare' }>): readonly CompareBar[] => {
  const top = Math.max(...figure.rows.map((r) => Math.abs(r.value))) || 1;
  return figure.rows.map((r) => ({ ...r, share: (Math.abs(r.value) / top) * 50 }));
};

export const PRICE = { top: 10, plot: 96, volumeGap: 12, volume: 34, foot: 20, inset: 2 } as const;

const priceGutter = (figure: Extract<Figure, { kind: 'price' }>): number => {
  if (figure.volumes) return 92;
  return figure.levels.length ? 72 : 8;
};

export const priceFigureGeometry = (figure: Extract<Figure, { kind: 'price' }>, width: number) => {
  const n = Math.max(figure.closes.length - 1, 1);
  const right = Math.max(width - priceGutter(figure), PRICE.inset + 1);
  const values = [...figure.closes, ...figure.levels.map((l) => l.price)];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const room = (hi - lo || hi * 0.001) * 0.08;
  const x = linearScale([0, n], [PRICE.inset, right]);
  const y = linearScale([lo - room, hi + room], [PRICE.top + PRICE.plot, PRICE.top]);
  const volumeTop = PRICE.top + PRICE.plot + PRICE.volumeGap;
  const plotEnd = figure.volumes ? volumeTop + PRICE.volume : PRICE.top + PRICE.plot;
  const maxVolume = figure.volumes ? Math.max(...figure.volumes, figure.usualVolume ?? 0) || 1 : 1;
  const volumeY = (v: number) => volumeTop + PRICE.volume - (v / maxVolume) * PRICE.volume;
  const spanFrom = figure.span ? n - figure.span : null;
  return {
    height: plotEnd + PRICE.foot,
    right,
    plotEnd,
    lo,
    hi,
    line: figure.closes.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''),
    end: { x: x(figure.closes.length - 1), y: y(figure.closes.at(-1) ?? lo) },
    span: spanFrom === null ? null : { x: x(spanFrom), width: x(n) - x(spanFrom) },
    levels: figure.levels.map((level) => ({ ...level, y: y(level.price) })),
    volumes: (figure.volumes ?? []).map((v, i) => ({
      key: i,
      x: x(i),
      y: volumeY(v),
      height: Math.max(1, volumeTop + PRICE.volume - volumeY(v)),
      width: Math.max(2, ((right - PRICE.inset) / n) * 0.6),
      marked: spanFrom !== null && i > spanFrom,
    })),
    usual: figure.volumes && figure.usualVolume !== null ? volumeY(figure.usualVolume) : null,
    volumeTop,
    endAt: figure.startAt + (figure.closes.length - 1) * 60_000,
  };
};
