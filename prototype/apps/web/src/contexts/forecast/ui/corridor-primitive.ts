import { type ChartFrame, FRAME_MS } from '@reinforce/server/dto';
import type {
  AutoscaleInfo,
  IChartApiBase,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  Logical,
  SeriesAttachedParameter,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { type CorridorKnot, wallSeconds } from '../domain/signal-chart-vm';

export type CorridorPaint = {
  readonly fill: string;
  readonly fade: string;
  readonly edge: string;
  readonly mid: string;
};

type Point = { readonly x: number; readonly lo: number; readonly mid: number; readonly hi: number };

const MID_DASH = [4, 3];

function trace(context: CanvasRenderingContext2D, points: readonly Point[], side: 'lo' | 'mid' | 'hi'): void {
  points.forEach((p, i) => {
    if (i === 0) context.moveTo(p.x, p[side]);
    else context.lineTo(p.x, p[side]);
  });
}

/** The forecast's range drawn under the candles, kept in sight by the price scale while its time is on screen. */
export class CorridorPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApiBase<Time> | null = null;
  private series: ISeriesApi<SeriesType, Time> | null = null;
  private requestUpdate: (() => void) | null = null;
  private knots: readonly CorridorKnot[] = [];
  private keep: readonly number[] = [];
  private frame: ChartFrame = '1m';
  private paint: CorridorPaint = {
    fill: 'transparent',
    fade: 'transparent',
    edge: 'transparent',
    mid: 'transparent',
  };
  private readonly views: readonly IPrimitivePaneView[] = [
    { zOrder: () => 'bottom', renderer: () => this.renderer() },
  ];

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>): void {
    this.chart = chart;
    this.series = series;
    this.requestUpdate = requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }

  show(input: {
    readonly knots: readonly CorridorKnot[];
    readonly keep: readonly number[];
    readonly frame: ChartFrame;
    readonly paint: CorridorPaint;
  }): void {
    this.knots = input.knots;
    this.keep = input.keep;
    this.frame = input.frame;
    this.paint = input.paint;
    this.requestUpdate?.();
  }

  autoscaleInfo(_start: Logical, end: Logical): AutoscaleInfo | null {
    const first = this.knots[0];
    if (!first) return null;
    const at = this.logicalOf(first.at);
    if (at === null || at > end) return null;
    const prices = [...this.knots.flatMap((k) => [k.lo, k.hi]), ...this.keep];
    return { priceRange: { minValue: Math.min(...prices), maxValue: Math.max(...prices) } };
  }

  private indexOf(at: number): { readonly index: number; readonly share: number } | null {
    const scale = this.chart?.timeScale();
    if (!scale) return null;
    const step = FRAME_MS[this.frame];
    const slot = Math.floor(at / step) * step;
    const share = (at - slot) / step;
    const index = scale.timeToIndex(wallSeconds(slot) as UTCTimestamp, false);
    return index === null ? null : { index, share };
  }

  private logicalOf(at: number): number | null {
    const found = this.indexOf(at);
    return found === null ? null : found.index + found.share;
  }

  // The library places only whole bars, so a moment inside a bar is put between it and the next one.
  private xOf(at: number): number | null {
    const scale = this.chart?.timeScale();
    const found = this.indexOf(at);
    if (!scale || found === null) return null;
    const x0 = scale.logicalToCoordinate(found.index as unknown as Logical);
    const x1 = scale.logicalToCoordinate((found.index + 1) as Logical);
    if (x0 === null) return null;
    return x1 === null ? x0 : x0 + found.share * (x1 - x0);
  }

  private points(): readonly Point[] {
    const series = this.series;
    if (!series) return [];
    return this.knots.flatMap((k) => {
      const x = this.xOf(k.at);
      const lo = series.priceToCoordinate(k.lo);
      const mid = series.priceToCoordinate(k.mid);
      const hi = series.priceToCoordinate(k.hi);
      return x === null || lo === null || mid === null || hi === null ? [] : [{ x, lo, mid, hi }];
    });
  }

  private renderer(): IPrimitivePaneRenderer | null {
    const points = this.points();
    if (points.length < 2) return null;
    const { fill, fade, edge, mid } = this.paint;
    return {
      draw: (target) =>
        target.useMediaCoordinateSpace(({ context }) => {
          const first = points[0];
          const last = points.at(-1);
          if (!first || !last) return;
          const gradient = context.createLinearGradient(first.x, 0, last.x, 0);
          gradient.addColorStop(0, fill);
          gradient.addColorStop(1, fade);
          context.beginPath();
          trace(context, points, 'hi');
          for (const p of points.toReversed()) context.lineTo(p.x, p.lo);
          context.closePath();
          context.fillStyle = gradient;
          context.fill();
          context.lineWidth = 1;
          context.strokeStyle = edge;
          for (const side of ['hi', 'lo'] as const) {
            context.beginPath();
            trace(context, points, side);
            context.stroke();
          }
          context.setLineDash(MID_DASH);
          context.lineWidth = 1.5;
          context.strokeStyle = mid;
          context.beginPath();
          trace(context, points, 'mid');
          context.stroke();
          context.setLineDash([]);
        }),
    };
  }
}
