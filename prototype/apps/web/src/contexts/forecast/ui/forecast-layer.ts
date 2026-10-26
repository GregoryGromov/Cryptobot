import { type Candle, type ChartFrame, FRAME_MS } from '@reinforce/server/dto';
import {
  type IPriceLine,
  type ISeriesApi,
  LineStyle,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { type ChartLevels, type CorridorKnot, wallSeconds } from '../domain/signal-chart-vm';
import { CorridorPrimitive } from './corridor-primitive';
import { type PinPoint, PinPrimitive } from './pin-primitive';
import type { SignalPalette } from './signal-palette';

export type ForecastWords = {
  readonly target: string;
  readonly entry: string;
  readonly stop: string;
};

export type ForecastDrawing = {
  readonly knots: readonly CorridorKnot[];
  readonly levels: ChartLevels | null;
  readonly signalAt: number | null;
  readonly words: ForecastWords;
};

const wall = (moment: number) => wallSeconds(moment) as UTCTimestamp;

const NO_PAINT = { fill: 'transparent', fade: 'transparent', edge: 'transparent', mid: 'transparent' };

/** Moves the page element pinned to the chart onto its point, or hides it while the point is off screen. */
export function placePin(element: HTMLElement | null, point: PinPoint | null): void {
  if (!element) return;
  element.style.visibility = point ? 'visible' : 'hidden';
  if (point) element.style.translate = `${point.x}px ${point.y}px`;
}

/** A forecast drawn on a series: its range under the candles, the trade's levels across, a pin over the signal's candle. */
export class ForecastLayer {
  private readonly series: ISeriesApi<SeriesType, Time>;
  private readonly corridor = new CorridorPrimitive();
  private readonly pin: PinPrimitive;
  private lines: IPriceLine[] = [];

  constructor(series: ISeriesApi<SeriesType, Time>, place: (point: PinPoint | null) => void) {
    this.series = series;
    this.pin = new PinPrimitive(place);
    series.attachPrimitive(this.corridor);
    series.attachPrimitive(this.pin);
  }

  clear(): void {
    for (const line of this.lines) this.series.removePriceLine(line);
    this.lines = [];
    this.corridor.show({ knots: [], keep: [], frame: '1m', paint: NO_PAINT });
    this.pin.show(null);
  }

  show(input: {
    readonly drawing: ForecastDrawing | null;
    readonly candles: readonly Candle[];
    readonly frame: ChartFrame;
    readonly palette: SignalPalette;
  }): void {
    const { drawing, candles, frame, palette } = input;
    for (const line of this.lines) this.series.removePriceLine(line);
    this.lines = [];
    const levels = drawing?.levels ?? null;
    this.corridor.show({
      knots: drawing?.knots ?? [],
      keep: levels ? [levels.stop, levels.take] : [],
      frame,
      paint: { fill: palette.range, fade: palette.rangeFade, edge: palette.rangeEdge, mid: palette.rangeMid },
    });
    const step = FRAME_MS[frame];
    const slot = drawing?.signalAt == null ? null : Math.floor(drawing.signalAt / step) * step;
    const marked = candles.find((c) => c.t === slot);
    this.pin.show(marked ? { time: wall(marked.t), price: marked.h } : null);
    if (!drawing || !levels) return;
    this.lines = [
      this.series.createPriceLine({
        price: levels.take,
        color: palette.upLine,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: drawing.words.target,
        axisLabelColor: palette.up,
        axisLabelTextColor: palette.label,
      }),
      this.series.createPriceLine({
        price: levels.entry,
        color: palette.entryLine,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: drawing.words.entry,
        axisLabelColor: palette.entry,
        axisLabelTextColor: palette.onEntry,
      }),
      this.series.createPriceLine({
        price: levels.stop,
        color: palette.downLine,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: drawing.words.stop,
        axisLabelColor: palette.down,
        axisLabelTextColor: palette.label,
      }),
    ];
  }
}
