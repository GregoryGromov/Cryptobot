import type { Candle, ChatProposal, ForecastNote, SignalView } from '@reinforce/server/dto';
import { dealLevels, dealPhase } from '~/contexts/trading/domain/deal-phase';
import { useServerNow } from '~/shared/api/live';
import { useTradingMode } from '~/shared/api/trading-mode';
import { useT } from '~/shared/i18n';
import { onTerm } from '../domain/episode-vm';
import { type ChartLevels, corridorKnots } from '../domain/signal-chart-vm';
import type { ForecastDrawing } from './forecast-layer';

const NOW_TICK_MS = 15_000;

/** A forecast as a chart draws it: on the term the person trades, with the levels of the trade offered on it. */
export type ChartForecast = {
  readonly forecast: ForecastNote;
  readonly levels: ChartLevels | null;
  readonly signal: SignalView | null;
};

/** The forecast a conversation's own chart draws, as its card draws it. */
export function useChartForecast(
  source: {
    readonly forecast: ForecastNote;
    readonly signal: SignalView | null;
    readonly proposal: ChatProposal | null;
  } | null,
): ChartForecast | null {
  const { horizon } = useTradingMode();
  const now = useServerNow(NOW_TICK_MS);
  if (!source) return null;
  const levels = source.proposal ? dealLevels(dealPhase(source.proposal, now)) : null;
  return {
    forecast: onTerm(source.forecast, horizon),
    levels: levels && { stop: levels.stop, entry: levels.entry, take: levels.take },
    signal: source.signal,
  };
}

export function useForecastDrawing(
  source: ChartForecast | null,
  candles: readonly Candle[],
): ForecastDrawing | null {
  const { t } = useT('forecast');
  if (!source) return null;
  return {
    knots: corridorKnots(source.forecast, candles.at(-1)?.c ?? null),
    levels: source.levels,
    signalAt: source.signal?.eventAt ?? null,
    words: {
      target: t('signal.chart.target'),
      entry: t('signal.chart.entry'),
      stop: t('signal.chart.stop'),
    },
  };
}
