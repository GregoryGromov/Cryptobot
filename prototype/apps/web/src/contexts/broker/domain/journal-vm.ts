import type { Cls, ForecastCheckStatus, Horizon, Journal, Probs } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { CLEAR_LEAN_TENTHS, type Lean, leanOf } from '~/contexts/forecast/domain/verdict';
import type { Direction } from '~/shared/format/percent';

type HorizonForecast = Journal[number]['forecasts'][number];

export type CheckMark = 'hit' | 'miss' | 'no-lean' | 'waiting' | 'no-prices' | 'not-scored';

export type JournalCheck = {
  readonly horizon: Horizon;
  readonly mark: CheckMark;
  readonly status: ForecastCheckStatus;
  readonly checkAt: number;
  readonly lean: Cls | null;
  readonly outcome: Cls | null;
};

export type JournalRow = {
  readonly id: string;
  readonly coin: string;
  readonly at: number;
  readonly threadId: string | null;
  readonly scored: boolean;
  readonly version: number | null;
  readonly horizon: Horizon;
  readonly probs: Probs;
  readonly lean: Lean;
  readonly tone: Direction;
  readonly check: JournalCheck;
};

const toneOf = (lean: Lean): Direction => {
  if (!lean || lean.tenths < CLEAR_LEAN_TENTHS) return 'flat';
  return match(lean.cls)
    .with('UP', (): Direction => 'up')
    .with('DOWN', (): Direction => 'down')
    .with('FLAT', (): Direction => 'flat')
    .exhaustive();
};

const markOf = (forecast: HorizonForecast): CheckMark => {
  const { result } = forecast;
  if (!result) return 'waiting';
  return match(result)
    .with({ status: 'resolved' }, (resolved): CheckMark => {
      const lean = leanOf(forecast.probs);
      if (!lean) return 'no-lean';
      return lean.cls === resolved.cls ? 'hit' : 'miss';
    })
    .with({ status: 'pending-evaluation' }, (): CheckMark => 'waiting')
    .with({ status: 'unresolved-data-quality' }, (): CheckMark => 'no-prices')
    .with({ status: 'not-prospective' }, (): CheckMark => 'not-scored')
    .exhaustive();
};

const checkOf = (forecast: HorizonForecast): JournalCheck => ({
  horizon: forecast.horizon,
  mark: markOf(forecast),
  status: forecast.result?.status ?? 'waiting',
  checkAt: forecast.checkAt,
  lean: leanOf(forecast.probs)?.cls ?? null,
  outcome: forecast.result?.cls ?? null,
});

const SCORED: readonly Journal[number]['cohort'][] = ['official', 'on-demand'];

export const journalRows = (journal: Journal, horizon: Horizon): readonly JournalRow[] =>
  journal.flatMap((entry) => {
    const main = entry.forecasts.find((forecast) => forecast.horizon === horizon);
    if (!main) return [];
    const lean = leanOf(main.probs);
    return [
      {
        id: entry.id,
        coin: entry.coin,
        at: entry.receivedAt,
        threadId: entry.threadId,
        scored: SCORED.includes(entry.cohort),
        version: entry.versionN,
        horizon: main.horizon,
        probs: main.probs,
        lean,
        tone: toneOf(lean),
        check: checkOf(main),
      },
    ];
  });
