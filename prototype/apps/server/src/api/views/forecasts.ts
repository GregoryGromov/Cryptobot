import { HORIZONS } from '@reinforce/harness-contract';
import { type Locale, translator } from '@reinforce/i18n/server';
import * as broker from '../../modules/broker/index.js';
import * as forecast from '../../modules/forecast/index.js';
import * as market from '../../modules/market/index.js';
import { availableModels } from '../../platform/config.js';
import type { Deps } from '../../workflows/deps.js';
import type {
  AgentView,
  Cls,
  Cohort,
  ForecastNote,
  ForecastView,
  Journal,
  Probs,
  Quality,
} from '../view-types.js';
import { portfolioView } from './portfolio.js';
import { levelPrices } from './why.js';

export const probs = (p: { up: number; flat: number; down: number }): Probs => ({
  p_up: p.up,
  p_flat: p.flat,
  p_down: p.down,
});
const classOf = (value: forecast.Score['outcome']): Cls =>
  (({ up: 'UP', flat: 'FLAT', down: 'DOWN' }) as const)[value];
const avg = (xs: number[]): number | null =>
  xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : null;
const lean = (p: Probs): Cls | null => {
  const sorted = (Object.entries(p) as [keyof Probs, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0] && sorted[1] && sorted[0][1] > sorted[1][1]
    ? ({ p_up: 'UP', p_flat: 'FLAT', p_down: 'DOWN' } as const)[sorted[0][0]]
    : null;
};
export async function forecastView(
  deps: Deps,
  value: forecast.Forecast,
): Promise<ForecastView & { threadId: string }> {
  const dispatch = await forecast.findDispatch(deps.db, value.dispatchId);
  const version = await broker.findVersion(deps.db, value.versionId);
  if (!dispatch || !version) throw new Error('Forecast provenance missing');
  const resolutions = (await forecast.listResolutions(deps.db, value.id))
    .filter((r) => r.rulesVersion === dispatch.scoringVersion)
    .sort((a, b) => b.createdAt - a.createdAt);
  const now = deps.clock.now();
  const reference = resolutions[0]
    ? await market.findCandleById(deps.db, resolutions[0].referenceCandle)
    : now >= dispatch.t0
      ? await market.findCandle(deps.db, dispatch.instrument, dispatch.t0 - 60000)
      : undefined;
  const duePrices = await Promise.all(
    value.body.horizons.map(async (h) => {
      const due = dispatch.t0 + h.horizon * 60000;
      return due <= now && value.receivedAt < dispatch.t0
        ? await market.findCandle(deps.db, dispatch.instrument, due - 60000)
        : undefined;
    }),
  );
  const snapshot = await market.findSnapshot(deps.db, dispatch.snapshotId);
  const statePrice = snapshot
    ? (
        await market.loadCandlesAsOf(
          deps.db,
          dispatch.instrument,
          snapshot.cutoffAt - 60000,
          snapshot.cutoffAt,
          dispatch.createdAt,
        )
      )[0]
    : undefined;
  const baselines = await forecast.listBaselines(deps.db, dispatch.id);
  const trade = value.body.trade;
  return {
    id: value.id,
    threadId: dispatch.id,
    coin: dispatch.instrument,
    cohort: value.cohort,
    stateId: dispatch.snapshotId,
    receivedAt: value.receivedAt,
    t0: dispatch.t0,
    deadline: dispatch.deadline,
    origin: dispatch.origin === 'event' ? 'event' : 'request',
    refines: null,
    versionId: version.id,
    versionN: version.number,
    runtime: 'local',
    attestation: 'platform-verified',
    p0: reference ? Number(reference.candle.close) : null,
    stateClose: statePrice ? Number(statePrice.candle.close) : null,
    forecasts: value.body.horizons.map((h, i) => {
      const resolution = resolutions.find((r) => r.horizon === h.horizon);
      const baseline = baselines.find((b) => b.horizon === h.horizon)?.body;
      const checkAt = dispatch.t0 + h.horizon * 60000;
      const pendingStatus =
        value.receivedAt >= dispatch.t0
          ? 'not-prospective'
          : checkAt > now
            ? null
            : !reference || !duePrices[i]
              ? 'unresolved-data-quality'
              : 'pending-evaluation';
      return {
        horizon: h.horizon,
        probs: probs(h.probabilities),
        expected: h.expectedReturnPct,
        q: h.quantiles,
        checkAt,
        reference: baseline?.probabilities ? { ...probs(baseline.probabilities), n: baseline.n } : null,
        result: resolution
          ? {
              status: 'resolved',
              returnPct: resolution.score.returnPct,
              cls: classOf(resolution.score.outcome),
              brier: resolution.score.brier,
              brierRef: resolution.score.referenceBrier,
              inInterval: resolution.score.covered,
            }
          : pendingStatus
            ? {
                status: pendingStatus,
                returnPct: null,
                cls: null,
                brier: null,
                brierRef: null,
                inInterval: null,
              }
            : null,
      };
    }),
    plan: {
      action: trade.action,
      selected_horizon_minutes: trade.horizon,
      position_size_pct_nav: trade.sizePct,
      stop_loss_pct: trade.action === 'FLAT' ? null : trade.stopPct,
      take_profit_pct: trade.action === 'FLAT' ? null : trade.targetPct,
    },
    rationale: value.body.schemaVersion === '2' ? value.body.rationale : null,
    levels: snapshot ? levelPrices(snapshot) : {},
  };
}
export function forecastNote(view: ForecastView, threadId: string): ForecastNote | null {
  const r = view.rationale;
  if (!r) return null;
  const plan = view.plan;
  const price = (level: keyof ForecastView['levels']) => view.levels[level] ?? null;
  const invalidation = r.invalidation && price(r.invalidation.level);
  const mark = r.chart[0];
  const markPrice = mark ? price(mark.level) : null;
  return {
    id: view.id,
    threadId,
    coin: view.coin,
    at: view.receivedAt,
    t0: view.t0,
    p0: view.p0 ?? view.stateClose,
    cohort: view.cohort,
    version: view.versionN,
    headline: r.headline,
    thesis: r.thesis,
    horizons: view.forecasts.map((h) => ({
      horizon: h.horizon,
      probs: h.probs,
      expected: h.expected,
      q10: h.q.q10,
      q50: h.q.q50,
      q90: h.q.q90,
      tau: forecast.SCORING_RULES.neutralPct[h.horizon],
      checkAt: h.checkAt,
      checkStatus: h.result?.status ?? 'waiting',
      checked:
        h.result?.status === 'resolved' && h.result.returnPct !== null
          ? { returnPct: h.result.returnPct, cls: h.result.cls }
          : null,
      note: r.horizons.find((n) => n.horizon === h.horizon)?.note ?? null,
    })),
    plan:
      plan.action === 'FLAT'
        ? { action: 'FLAT', horizon: plan.selected_horizon_minutes }
        : {
            action: plan.action,
            horizon: plan.selected_horizon_minutes,
            sizePct: plan.position_size_pct_nav,
            stopPct: plan.stop_loss_pct ?? 0,
            targetPct: plan.take_profit_pct ?? 0,
          },
    points: r.points.map((p) => ({ stance: p.stance, weight: p.weight })),
    invalidation:
      r.invalidation && invalidation !== null
        ? { when: r.invalidation.when, level: r.invalidation.level, price: invalidation }
        : null,
    mark: mark && markPrice !== null ? { label: mark.label, price: markPrice } : null,
  };
}
export async function journalView(deps: Deps, userId: string | undefined): Promise<Journal> {
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  if (!personal) return [];
  return Promise.all(
    (await forecast.listBrokerForecasts(deps.db, personal.id)).map((f) => forecastView(deps, f)),
  );
}
export function qualityView(journal: Journal, cohort: Cohort, dispatched: number): Quality {
  const selected = journal.filter((f) => f.cohort === cohort);
  const pairs = selected.flatMap((f) => f.forecasts.filter((h) => h.result?.status === 'resolved'));
  return {
    cohort,
    forecasts: selected.length,
    dispatched,
    coverage: dispatched ? selected.length / dispatched : null,
    horizons: HORIZONS.map((horizon) => {
      const outcomes = pairs.filter((h) => h.horizon === horizon);
      const brier = avg(
        outcomes.flatMap((h) =>
          h.result?.brier === null || h.result?.brier === undefined ? [] : [h.result.brier],
        ),
      );
      const paired = outcomes.filter((h) => h.result?.brierRef !== null && h.result?.brierRef !== undefined);
      const brierRef = avg(paired.map((h) => h.result!.brierRef!));
      const pairedBrier = avg(paired.map((h) => h.result!.brier!));
      return {
        horizon,
        n: outcomes.length,
        provisional: outcomes.length < forecast.SCORING_RULES.provisionalBelow,
        brier,
        brierRef,
        skill: brierRef && pairedBrier !== null ? 1 - pairedBrier / brierRef : null,
        mae: avg(outcomes.map((h) => Math.abs(h.expected - h.result!.returnPct!))),
        pinball: avg(
          outcomes.map((h) => {
            const actual = h.result!.returnPct!;
            return (
              (
                [
                  [h.q.q10, 0.1],
                  [h.q.q50, 0.5],
                  [h.q.q90, 0.9],
                ] as const
              ).reduce(
                (sum, [q, level]) => sum + Math.max(level * (actual - q), (level - 1) * (actual - q)),
                0,
              ) / 3
            );
          }),
        ),
        coverage: avg(outcomes.map((h) => Number(h.result?.inInterval))),
      };
    }),
    calibration: Array.from({ length: 11 }, (_, tick) => {
      const level = tick / 10;
      const observations = pairs.flatMap((h) =>
        (['p_up', 'p_flat', 'p_down'] as const)
          .filter((key) => h.probs[key] === level)
          .map((key) =>
            Number(({ p_up: 'UP', p_flat: 'FLAT', p_down: 'DOWN' } as const)[key] === h.result?.cls),
          ),
      );
      return { level: tick, n: observations.length, observed: avg(observations) };
    }),
  };
}
export async function agentView(deps: Deps, userId: string | undefined, locale: Locale): Promise<AgentView> {
  const t = translator(locale);
  const personal = userId ? await broker.findBroker(deps.db, userId) : undefined;
  const head = personal ? await broker.loadHead(deps.db, personal.id) : null;
  const versions = personal ? await broker.listVersions(deps.db, personal.id) : [];
  const journal = await journalView(deps, userId);
  const dispatches = personal ? await forecast.listDispatches(deps.db, personal.id) : [];
  const official = dispatches.filter(
    (d) => d.origin === 'event' && d.deadline <= deps.clock.now() && d.deadline - d.createdAt >= 30000,
  ).length;
  const books = await portfolioView(deps, userId, locale);
  const scorecard: AgentView['scorecard'] = {
    forecasts: journal.length,
    terms: HORIZONS.map((horizon) => ({ horizon, n: 0, hits: 0 })),
    n: 0,
    hits: 0,
    marketHits: 0,
    marketN: 0,
    official: { n: 0, hits: 0 },
    pending: 0,
    unresolved: 0,
    notProspective: 0,
    nextCheckAt: null,
  };
  for (const f of journal)
    for (const h of f.forecasts) {
      const main = h.horizon === f.plan.selected_horizon_minutes;
      if (h.result?.status === 'resolved') {
        const hit = lean(h.probs) === h.result.cls;
        const term = scorecard.terms.find((t) => t.horizon === h.horizon)!;
        term.n++;
        if (hit) term.hits++;
        if (main) {
          scorecard.n++;
          if (hit) scorecard.hits++;
          if (f.cohort === 'official') {
            scorecard.official.n++;
            if (hit) scorecard.official.hits++;
          }
          if (h.reference) {
            scorecard.marketN++;
            if (lean(h.reference) === h.result.cls) scorecard.marketHits++;
          }
        }
      } else if (main) {
        if (h.result?.status === 'not-prospective') {
          scorecard.notProspective++;
          continue;
        }
        scorecard.pending++;
        if (h.result?.status === 'unresolved-data-quality') scorecard.unresolved++;
        if (h.checkAt > deps.clock.now())
          scorecard.nextCheckAt = Math.min(scorecard.nextCheckAt ?? h.checkAt, h.checkAt);
      }
    }
  return {
    templatePrompt: t('broker.prompt'),
    availableModels: availableModels(deps.config),
    books,
    quality: {
      official: qualityView(journal, 'official', official),
      onDemand: qualityView(journal, 'on-demand', 0),
      late: qualityView(journal, 'late', 0),
    },
    scorecard,
    horizons: HORIZONS,
    versions: versions.map((v) => {
      const own = journal.filter((f) => f.versionId === v.id);
      const q = qualityView(own, 'official', 0).horizons.find((h) => h.horizon === 15)!;
      return {
        id: v.id,
        n: v.number,
        active: v.id === head?.versionId,
        prompt: v.prompt,
        modelId: v.model,
        model: deps.config.MODEL_MODE === 'replay' ? 'scripted' : 'grok',
        harness: t('harness.builtin'),
        harnessKind: 'builtin',
        externalUrl: null,
        code: null,
        note: v.note,
        createdAt: v.createdAt,
        forecasts: own.length,
        skill15: q.skill,
        n15: q.n,
      };
    }),
  };
}
