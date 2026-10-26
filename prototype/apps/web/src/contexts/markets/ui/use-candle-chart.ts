import type { Candle } from '@reinforce/server/dto';
import {
  CandlestickSeries,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineSeries,
  LineStyle,
  type Logical,
  type LogicalRange,
  PriceScaleMode,
  TickMarkType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { type ForecastDrawing, ForecastLayer, placePin } from '~/contexts/forecast/ui/forecast-layer';
import type { PinPoint } from '~/contexts/forecast/ui/pin-primitive';
import type { SignalPalette } from '~/contexts/forecast/ui/signal-palette';
import { formattersFor } from '~/shared/format/use-formatters';
import {
  type ChartView,
  type Frame,
  fromWallSeconds,
  markedCandles,
  type SignalMark,
  type Span,
  slotsAfter,
  spanEdges,
  wallSeconds,
} from '../domain/chart-vm';
import type { IndicatorLines, Point } from '../domain/indicators';
import type { ChartPalette } from './chart-palette';
import type { ChartLook } from './use-chart-dock';

const SHOWN_BARS = 160;
const FEWEST_SHOWN = 40;
const NEAR_START_BARS = 30;
const CLEAR = 'rgba(0, 0, 0, 0)';

/** A forecast drawn over the candles as its card draws it; `opening` is the view it opens on while it runs. */
export type ChartForecastLayer = {
  readonly drawing: ForecastDrawing;
  readonly end: number;
  readonly opening: Span | null;
  readonly palette: SignalPalette;
};

/** Another market drawn beside this one, both as their change since the first candle in sight. */
export type ComparedLine = {
  readonly coin: string;
  readonly name: string;
  readonly color: string;
  readonly candles: readonly Candle[];
};

const RSI_LEVELS = [70, 30] as const;
const RSI_PANE_SHARE = 0.25;

const pointsOf = (points: readonly Point[]) =>
  points.map((p) => ({ time: wallSeconds(p.t) as UTCTimestamp, value: p.value }));

function volumeColor(candle: Candle, loud: boolean, palette: ChartPalette): string {
  const rise = candle.c >= candle.o;
  if (loud) return rise ? palette.up : palette.down;
  return rise ? palette.upSoft : palette.downSoft;
}

const at = (time: Time) => fromWallSeconds(Number(time));

function axisNumber(value: number, locale: string): string {
  const size = Math.abs(value);
  const digits = size >= 10_000 ? 0 : size >= 10 ? 2 : size >= 1 ? 3 : 5;
  return formattersFor(locale).decimal(value, digits);
}

function viewOf(chart: IChartApi): ChartView | null {
  const scale = chart.timeScale();
  const x0 = scale.logicalToCoordinate(0 as Logical);
  const x1 = scale.logicalToCoordinate(1 as Logical);
  if (x0 === null || x1 === null) return null;
  const pane = chart.paneSize();
  return { width: pane.width, height: pane.height, x0, step: x1 - x0 };
}

/** Draws the candles into `host` and tells how they lie on it, after every scroll, zoom and resize. */
export function useCandleChart(input: {
  readonly host: HTMLDivElement | null;
  readonly candles: readonly Candle[];
  readonly frame: Frame;
  readonly palette: ChartPalette;
  readonly locale: string;
  /** A span to bring into sight when it is not, a little of what came before and after it around it. */
  readonly focus: Span | null;
  /** Signals to mark on the candles they fired on: an arrow up below, an arrow down above. */
  readonly marks?: readonly SignalMark[];
  /** Candles, or a line through their closes. */
  readonly look?: ChartLook;
  /** Called as the person scrolls near the first candle, for older ones to come before it. */
  readonly onReachStart?: () => void;
  /** A forecast to draw over the candles; none when absent. */
  readonly forecast?: ChartForecastLayer | null;
  /** The page element kept over the forecast's signal candle. */
  readonly pin?: HTMLElement | null;
  /** Markets to draw beside this one; the chart is in percent while there are any. */
  readonly compare?: readonly ComparedLine[];
  /** The market's name, signed at the end of its line while others are drawn beside it. */
  readonly name?: string;
  /** Indicators to draw with the candles; none while markets are compared. */
  readonly indicators?: IndicatorLines | null;
}): ChartView | null {
  const {
    host,
    candles,
    frame,
    palette,
    locale,
    focus,
    marks,
    look = 'candles',
    onReachStart,
    forecast,
    pin,
    compare,
    name,
    indicators,
  } = input;
  const comparing = (compare?.length ?? 0) > 0;
  const drawnIndicators = comparing ? null : (indicators ?? null);
  const loud = drawnIndicators?.loud ?? null;
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const lineMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const vwapRef = useRef<ISeriesApi<'Line'> | null>(null);
  const upperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiRef = useRef<{
    readonly series: ISeriesApi<'Line'>;
    readonly levels: readonly IPriceLine[];
  } | null>(null);
  const peersRef = useRef(
    new Map<string, { readonly series: ISeriesApi<'Line'>; candles: readonly Candle[] | null }>(),
  );
  const shownFrame = useRef<Frame | null>(null);
  const [view, setView] = useState<ChartView | null>(null);
  const reachedStart = useEffectEvent(() => onReachStart?.());
  const layerRef = useRef<ForecastLayer | null>(null);
  const pinned = useEffectEvent((point: PinPoint | null) => placePin(pin ?? null, point));

  useEffect(() => {
    if (!host) return;
    const peers = peersRef.current;
    const chart = createChart(host, {
      autoSize: true,
      // The link to TradingView its licence asks for stands at the foot of the settings.
      layout: { background: { color: 'transparent' }, fontSize: 11, attributionLogo: false },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.2 } },
      timeScale: { borderVisible: false, rightOffset: 4, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    });
    // The candles stay drawn under the line, only see-through, so the price line and the forecast stay on them.
    candleRef.current = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
      priceLineStyle: LineStyle.Dashed,
    });
    markersRef.current = createSeriesMarkers(candleRef.current, []);
    layerRef.current = new ForecastLayer(candleRef.current, pinned);
    // Indicator lines keep to the candles' scale and never stretch it.
    const overlay = {
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      visible: false,
      autoscaleInfoProvider: () => null,
    } as const;
    upperRef.current = chart.addSeries(LineSeries, overlay);
    lowerRef.current = chart.addSeries(LineSeries, overlay);
    vwapRef.current = chart.addSeries(LineSeries, { ...overlay, lineWidth: 2 });
    lineRef.current = chart.addSeries(LineSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerRadius: 3,
      visible: false,
    });
    lineMarkersRef.current = createSeriesMarkers(lineRef.current, []);
    volumeRef.current = chart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.86, bottom: 0 } });
    const moved = () => setView(viewOf(chart));
    const scrolled = (range: LogicalRange | null) => {
      moved();
      if (range && range.from < NEAR_START_BARS) reachedStart();
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(scrolled);
    chart.timeScale().subscribeSizeChange(moved);
    chartRef.current = chart;
    shownFrame.current = null;
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(scrolled);
      chart.timeScale().unsubscribeSizeChange(moved);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
      markersRef.current = null;
      lineMarkersRef.current = null;
      layerRef.current = null;
      vwapRef.current = null;
      upperRef.current = null;
      lowerRef.current = null;
      rsiRef.current = null;
      peers.clear();
    };
  }, [host]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart) return;
    const f = formattersFor(locale);
    // Prices are formatted by their series, so the RSI pane under them keeps its own whole numbers.
    const priceFormat = {
      type: 'custom',
      formatter: (value: number) => axisNumber(value, locale),
      minMove: 0.01,
    } as const;
    candleRef.current?.applyOptions({ priceFormat });
    lineRef.current?.applyOptions({ priceFormat });
    rsiRef.current?.series.applyOptions({
      priceFormat: { type: 'custom', formatter: (value: number) => f.decimal(value, 0), minMove: 1 },
    });
    chart.applyOptions({
      layout: {
        textColor: palette.text,
        fontFamily: getComputedStyle(document.body).fontFamily,
        panes: { separatorColor: palette.grid, separatorHoverColor: palette.cross },
      },
      grid: { vertLines: { color: palette.grid }, horzLines: { color: palette.grid } },
      crosshair: {
        vertLine: { color: palette.cross, labelBackgroundColor: palette.label, style: LineStyle.Dotted },
        horzLine: { color: palette.cross, labelBackgroundColor: palette.label, style: LineStyle.Dotted },
      },
      localization: {
        locale,
        percentageFormatter: (value: number) => f.change(value, 1),
        timeFormatter: (time: Time) => f.dateTime(at(time)),
      },
      timeScale: {
        tickMarkFormatter: (time: Time, type: TickMarkType) =>
          type === TickMarkType.Year
            ? String(new Date(at(time)).getFullYear())
            : type === TickMarkType.Month || type === TickMarkType.DayOfMonth
              ? f.day(at(time))
              : f.clock(at(time)),
      },
    });
  }, [host, palette, locale]);

  useEffect(() => {
    if (!host) return;
    const drawn = look === 'candles' && !comparing;
    candleRef.current?.applyOptions({
      upColor: drawn ? palette.up : CLEAR,
      downColor: drawn ? palette.down : CLEAR,
      wickUpColor: drawn ? palette.up : CLEAR,
      wickDownColor: drawn ? palette.down : CLEAR,
      lastValueVisible: drawn,
      priceLineColor: palette.cross,
    });
    lineRef.current?.applyOptions({
      visible: !drawn,
      color: palette.line,
      title: comparing ? (name ?? '') : '',
    });
    volumeRef.current?.applyOptions({ visible: !comparing });
    chartRef.current
      ?.priceScale('right')
      .applyOptions({ mode: comparing ? PriceScaleMode.Percentage : PriceScaleMode.Normal });
  }, [host, palette, look, comparing, name]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart) return;
    const lines = peersRef.current;
    const wanted = new Set((compare ?? []).map((line) => line.coin));
    for (const [coin, drawn] of lines)
      if (!wanted.has(coin)) {
        chart.removeSeries(drawn.series);
        lines.delete(coin);
      }
    for (const line of compare ?? []) {
      const drawn = lines.get(line.coin) ?? {
        series: chart.addSeries(LineSeries, {
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerRadius: 3,
        }),
        candles: null,
      };
      lines.set(line.coin, drawn);
      drawn.series.applyOptions({ color: line.color, title: line.name });
      if (drawn.candles === line.candles) continue;
      drawn.candles = line.candles;
      drawn.series.setData(line.candles.map((c) => ({ time: wallSeconds(c.t) as UTCTimestamp, value: c.c })));
    }
  }, [host, compare]);

  const end = forecast?.end ?? null;
  const openFrom = forecast?.opening?.from ?? null;
  const openTo = forecast?.opening?.to ?? null;
  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart) return;
    candleRef.current?.setData([
      ...candles.map((c) => ({
        time: wallSeconds(c.t) as UTCTimestamp,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      })),
      ...(end === null ? [] : slotsAfter(candles, end, frame)).map((t) => ({
        time: wallSeconds(t) as UTCTimestamp,
      })),
    ]);
    lineRef.current?.setData(candles.map((c) => ({ time: wallSeconds(c.t) as UTCTimestamp, value: c.c })));
    volumeRef.current?.setData(
      candles.map((c) => ({
        time: wallSeconds(c.t) as UTCTimestamp,
        value: c.v,
        color: volumeColor(c, loud?.has(c.t) ?? false, palette),
      })),
    );
    if (shownFrame.current !== frame && candles.length > 0) {
      shownFrame.current = frame;
      const shown = Math.min(SHOWN_BARS, Math.max(FEWEST_SHOWN, candles.length));
      if (openFrom !== null && openTo !== null)
        chart.timeScale().setVisibleRange({
          from: wallSeconds(openFrom) as UTCTimestamp,
          to: wallSeconds(openTo) as UTCTimestamp,
        });
      else chart.timeScale().setVisibleLogicalRange({ from: candles.length - shown, to: candles.length + 3 });
    }
    const frameId = requestAnimationFrame(() => setView(viewOf(chart)));
    return () => cancelAnimationFrame(frameId);
  }, [host, candles, frame, palette, end, openFrom, openTo, loud]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart) return;
    const draw = (series: ISeriesApi<'Line'> | null, points: readonly Point[] | null, color: string) => {
      series?.applyOptions({ visible: points !== null, color });
      series?.setData(points ? pointsOf(points) : []);
    };
    draw(vwapRef.current, drawnIndicators?.vwap ?? null, palette.vwap);
    draw(upperRef.current, drawnIndicators?.bands?.upper ?? null, palette.bands);
    draw(lowerRef.current, drawnIndicators?.bands?.lower ?? null, palette.bands);
    const rsi = drawnIndicators?.rsi ?? null;
    if (!rsi) {
      if (rsiRef.current) chart.removeSeries(rsiRef.current.series);
      rsiRef.current = null;
      if (chart.panes().length > 1) chart.removePane(1);
      return;
    }
    if (!rsiRef.current) {
      const series = chart.addSeries(
        LineSeries,
        {
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerRadius: 3,
          priceFormat: {
            type: 'custom',
            formatter: (value: number) => formattersFor(locale).decimal(value, 0),
            minMove: 1,
          },
        },
        1,
      );
      const levels = RSI_LEVELS.map((price) =>
        series.createPriceLine({ price, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false }),
      );
      rsiRef.current = { series, levels };
      chart.panes()[1]?.setStretchFactor(RSI_PANE_SHARE);
    }
    rsiRef.current.series.applyOptions({ color: palette.rsi });
    for (const level of rsiRef.current.levels) level.applyOptions({ color: palette.cross });
    rsiRef.current.series.setData(pointsOf(rsi));
  }, [host, palette, locale, drawnIndicators]);

  useEffect(() => {
    if (!host) return;
    if (forecast)
      layerRef.current?.show({ drawing: forecast.drawing, candles, frame, palette: forecast.palette });
    else layerRef.current?.clear();
  }, [host, forecast, candles, frame]);

  useEffect(() => {
    if (!host) return;
    const shown = markedCandles(candles, marks ?? [], frame).map((mark) =>
      mark.direction === 'UP'
        ? {
            time: wallSeconds(mark.t) as UTCTimestamp,
            position: 'belowBar' as const,
            shape: 'arrowUp' as const,
            color: palette.up,
          }
        : {
            time: wallSeconds(mark.t) as UTCTimestamp,
            position: 'aboveBar' as const,
            shape: 'arrowDown' as const,
            color: palette.down,
          },
    );
    // The marks stand on whichever series is drawn, so they keep to the candles or to the line.
    markersRef.current?.setMarkers(look === 'candles' ? shown : []);
    lineMarkersRef.current?.setMarkers(look === 'line' ? shown : []);
  }, [host, candles, marks, frame, palette, look]);

  const focusFrom = focus?.from ?? null;
  const focusTo = focus?.to ?? null;
  const revealed = useRef<string | null>(null);
  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart || focusFrom === null || focusTo === null || candles.length === 0) return;
    const key = `${focusFrom}-${focusTo}`;
    if (revealed.current === key) return;
    revealed.current = key;
    const shown = viewOf(chart);
    if (shown && spanEdges(candles, { from: focusFrom, to: focusTo }, shown)) return;
    const around = Math.max(focusTo - focusFrom, 30 * 60_000);
    chart.timeScale().setVisibleRange({
      from: wallSeconds(focusFrom - around) as UTCTimestamp,
      to: wallSeconds(focusTo + around) as UTCTimestamp,
    });
  }, [host, candles, focusFrom, focusTo]);

  return view;
}
