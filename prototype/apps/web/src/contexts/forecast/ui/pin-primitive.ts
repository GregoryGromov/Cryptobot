import type {
  IChartApiBase,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';

export type PinTarget = { readonly time: UTCTimestamp; readonly price: number };
export type PinPoint = { readonly x: number; readonly y: number };

/** Keeps a mark made of page elements on one point of the chart: it is told where that point is on every redraw. */
export class PinPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApiBase<Time> | null = null;
  private series: ISeriesApi<SeriesType, Time> | null = null;
  private requestUpdate: (() => void) | null = null;
  private target: PinTarget | null = null;
  private readonly views: readonly IPrimitivePaneView[] = [];
  private readonly place: (point: PinPoint | null) => void;

  constructor(place: (point: PinPoint | null) => void) {
    this.place = place;
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>): void {
    this.chart = chart;
    this.series = series;
    this.requestUpdate = requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
    this.place(null);
  }

  show(target: PinTarget | null): void {
    this.target = target;
    this.requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this.chart || !this.series || !this.target) {
      this.place(null);
      return;
    }
    const x = this.chart.timeScale().timeToCoordinate(this.target.time);
    const y = this.series.priceToCoordinate(this.target.price);
    const inside = x !== null && x >= 0 && x <= this.chart.timeScale().width();
    this.place(inside && y !== null ? { x, y } : null);
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }
}
