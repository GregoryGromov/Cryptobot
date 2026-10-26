import type { Candle } from '@reinforce/server/dto';
import {
  CandlestickSeries,
  CrosshairMode,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  TickMarkType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import type { ChartLook } from '~/contexts/markets/ui/use-chart-dock';
import { formattersFor } from '~/shared/format/use-formatters';
import { fromWallSeconds, futureSlots, type SignalFrame, wallSeconds } from '../domain/signal-chart-vm';
import { type ForecastDrawing, ForecastLayer, placePin } from './forecast-layer';
import type { SignalPalette } from './signal-palette';

export type { ForecastWords as SignalChartWords } from './forecast-layer';

const CLEAR = 'rgba(0, 0, 0, 0)';

const at = (time: Time) => fromWallSeconds(Number(time));
const wall = (moment: number) => wallSeconds(moment) as UTCTimestamp;

function axisNumber(value: number, locale: string): string {
  const size = Math.abs(value);
  const digits = size >= 10_000 ? 0 : size >= 10 ? 2 : size >= 1 ? 3 : 5;
  return formattersFor(locale).decimal(value, digits);
}

/** Draws the market around a forecast into `host`: candles or a line, volume, the forecast's range, the trade's levels, the signal. */
export function useSignalChart(input: {
  readonly host: HTMLDivElement | null;
  readonly pin: HTMLElement | null;
  readonly candles: readonly Candle[];
  readonly frame: SignalFrame;
  readonly palette: SignalPalette;
  readonly locale: string;
  readonly drawing: ForecastDrawing | null;
  readonly end: number;
  readonly opening: { readonly from: number; readonly to: number };
  readonly look: ChartLook;
}): void {
  const { host, pin, candles, frame, palette, locale, drawing, end, opening, look } = input;
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const layerRef = useRef<ForecastLayer | null>(null);
  const shownFrame = useRef<SignalFrame | null>(null);

  useEffect(() => {
    if (!host) return;
    const chart = createChart(host, {
      autoSize: true,
      // The link to TradingView its licence asks for stands at the foot of the settings.
      layout: { background: { color: 'transparent' }, fontSize: 11, attributionLogo: false },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.22 } },
      timeScale: { borderVisible: false, rightOffset: 2, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: { mouseWheel: false, vertTouchDrag: false },
      handleScale: { mouseWheel: false },
    });
    // The candles stay drawn under the line, only see-through, so the forecast they carry stays on screen.
    const series = chart.addSeries(CandlestickSeries, { borderVisible: false, priceLineVisible: false });
    const line = chart.addSeries(LineSeries, {
      lineWidth: 2,
      crosshairMarkerRadius: 3,
      priceLineVisible: false,
      visible: false,
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
    chartRef.current = chart;
    candleRef.current = series;
    lineRef.current = line;
    volumeRef.current = volume;
    layerRef.current = new ForecastLayer(series, (point) => placePin(pin, point));
    shownFrame.current = null;
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
      layerRef.current = null;
    };
  }, [host, pin]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!host || !chart) return;
    const f = formattersFor(locale);
    chart.applyOptions({
      layout: { textColor: palette.text, fontFamily: getComputedStyle(document.body).fontFamily },
      grid: { vertLines: { color: palette.grid }, horzLines: { color: palette.grid } },
      crosshair: {
        vertLine: { color: palette.cross, labelBackgroundColor: palette.label, style: LineStyle.Dotted },
        horzLine: { color: palette.cross, labelBackgroundColor: palette.label, style: LineStyle.Dotted },
      },
      localization: {
        locale,
        priceFormatter: (value: number) => axisNumber(value, locale),
        timeFormatter: (time: Time) => f.dateTime(at(time)),
      },
      timeScale: {
        tickMarkFormatter: (time: Time, type: TickMarkType) =>
          type === TickMarkType.Month || type === TickMarkType.DayOfMonth || type === TickMarkType.Year
            ? f.day(at(time))
            : f.clock(at(time)),
      },
    });
  }, [host, palette, locale]);

  useEffect(() => {
    if (!host) return;
    const candles = look === 'candles';
    candleRef.current?.applyOptions({
      upColor: candles ? palette.up : CLEAR,
      downColor: candles ? palette.down : CLEAR,
      wickUpColor: candles ? palette.up : CLEAR,
      wickDownColor: candles ? palette.down : CLEAR,
      lastValueVisible: candles,
    });
    lineRef.current?.applyOptions({ visible: !candles, color: palette.entry });
  }, [host, palette, look]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = candleRef.current;
    if (!host || !chart || !series) return;
    series.setData([
      ...candles.map((c) => ({ time: wall(c.t), open: c.o, high: c.h, low: c.l, close: c.c })),
      ...futureSlots(candles, end, frame).map((slot) => ({ time: wall(slot) })),
    ]);
    lineRef.current?.setData(candles.map((c) => ({ time: wall(c.t), value: c.c })));
    volumeRef.current?.setData(
      candles.map((c) => ({
        time: wall(c.t),
        value: c.v,
        color: c.c >= c.o ? palette.upSoft : palette.downSoft,
      })),
    );
    layerRef.current?.show({ drawing, candles, frame, palette });
    if (shownFrame.current !== frame && candles.length > 0) {
      shownFrame.current = frame;
      chart.timeScale().setVisibleRange({ from: wall(opening.from), to: wall(opening.to) });
    }
  }, [host, candles, frame, end, drawing, palette, opening]);
}
