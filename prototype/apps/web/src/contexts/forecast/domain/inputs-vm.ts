import type { InputRow, Inputs } from '@reinforce/server/dto';
import { fittedTicks, linearScale } from '@reinforce/ui-primitives/charts';
import { match } from 'ts-pattern';
import { tickDigits } from './fan-vm';

export type DataTab = 'candles' | Inputs['groups'][number]['id'] | 'answer';

export type DataSection = { readonly id: DataTab; readonly rows: number | null; readonly cited: number };

export const sectionsOf = (inputs: Pick<Inputs, 'groups' | 'cited'>): readonly DataSection[] => [
  { id: 'candles', rows: null, cited: 0 },
  ...inputs.groups.map((g) => ({
    id: g.id,
    rows: g.rows.length,
    cited: g.rows.filter((r) => inputs.cited.includes(r.id)).length,
  })),
  { id: 'answer', rows: null, cited: 0 },
];

export const tabOfRow = (inputs: Pick<Inputs, 'groups'>, row: string | null): DataTab | null =>
  row === null ? null : (inputs.groups.find((g) => g.rows.some((r) => r.id === row))?.id ?? null);

export const rowAnchor = (forecastId: string, row: string): string => `data-${forecastId}-${row}`;

export type WindowTone = Extract<InputRow, { kind: 'windows' }>['tone'];

export const BAR = { width: 14, height: 22, hot: 1.5 } as const;

export type WindowBar =
  | {
      readonly kind: 'ratio';
      readonly y: number;
      readonly height: number;
      readonly usual: number;
      readonly hot: boolean;
    }
  | { readonly kind: 'share'; readonly y: number; readonly height: number }
  | {
      readonly kind: 'signed';
      readonly y: number;
      readonly height: number;
      readonly sign: 'up' | 'down' | 'none';
    };

export const windowBar = (tone: WindowTone, value: number, values: readonly number[]): WindowBar =>
  match(tone)
    .with('ratio', (): WindowBar => {
      const max = Math.max(2, ...values);
      const height = Math.max(1.5, (value / max) * BAR.height);
      return {
        kind: 'ratio',
        y: BAR.height - height,
        height,
        usual: BAR.height - BAR.height / max,
        hot: value >= BAR.hot,
      };
    })
    .with('share', (): WindowBar => {
      const height = Math.max(1.5, (Math.min(Math.max(value, 0), 100) / 100) * BAR.height);
      return { kind: 'share', y: BAR.height - height, height };
    })
    .with('signed', 'plain', (kind): WindowBar => {
      const top = Math.max(...values.map(Math.abs)) || 1;
      const height = Math.max(1.5, (Math.abs(value) / top) * (BAR.height / 2));
      const sign = kind === 'plain' ? 'none' : value >= 0 ? 'up' : 'down';
      return { kind: 'signed', y: value >= 0 ? BAR.height / 2 - height : BAR.height / 2, height, sign };
    })
    .exhaustive();

export const CANDLES = { top: 12, plot: 140, gap: 10, volume: 30, foot: 20, gutter: 56, inset: 2 } as const;

export const candlesGeometry = (candles: Inputs['candles'], width: number) => {
  const first = candles[0];
  const last = candles.at(-1);
  if (!first || !last || width <= 0) return null;
  const right = Math.max(width - CANDLES.gutter, CANDLES.inset + 1);
  const lo = Math.min(...candles.map((c) => c.l));
  const hi = Math.max(...candles.map((c) => c.h));
  const axis = fittedTicks({ lo, hi, count: 4, minSpan: hi * 0.001 });
  const y = linearScale(axis.domain, [CANDLES.top + CANDLES.plot, CANDLES.top]);
  const step = (right - CANDLES.inset) / candles.length;
  const body = Math.max(1, step * 0.62);
  const volumeTop = CANDLES.top + CANDLES.plot + CANDLES.gap;
  const maxVolume = Math.max(...candles.map((c) => c.v)) || 1;
  return {
    height: volumeTop + CANDLES.volume + CANDLES.foot,
    right,
    lo,
    hi,
    from: first.t,
    to: last.t + 60_000,
    ticks: axis.ticks.map((value) => ({ value, y: y(value) })),
    digits: tickDigits(axis.ticks),
    bars: candles.map((c, i) => {
      const x = CANDLES.inset + (i + 0.5) * step;
      const volume = (c.v / maxVolume) * CANDLES.volume;
      return {
        key: c.t,
        x,
        body,
        top: y(Math.max(c.o, c.c)),
        bottom: y(Math.min(c.o, c.c)),
        high: y(c.h),
        low: y(c.l),
        up: c.c >= c.o,
        volumeY: volumeTop + CANDLES.volume - volume,
        volume,
      };
    }),
  };
};
