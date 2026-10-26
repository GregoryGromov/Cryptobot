import {
  type Exhibit,
  forecastSchema,
  hasEvidencePath,
  numberAt,
  type Point,
  replySchema,
} from '@reinforce/harness-contract';
import { LOCALES, translator } from '@reinforce/i18n/server';
import { z } from 'zod';
import { D } from '../kernel/money.js';
import { ModelFailure, type ModelPort } from './model.js';

const forecastInput = z.object({
  kind: z.literal('forecast'),
  dispatchId: z.string(),
  brokerVersionId: z.string(),
  snapshotId: z.string(),
  inputHash: z.string(),
  language: z.enum(LOCALES),
  market: z.record(z.string(), z.unknown()),
});
const responseInput = z.object({
  kind: z.literal('respond'),
  topic: z.string(),
  forecast: forecastSchema.nullable(),
  preferences: z.object({ maxTradeUsd: z.string() }),
  portfolio: z.object({ capital: z.string(), currentOrder: z.unknown().nullable() }),
  reviseProposal: replySchema.shape.proposal,
  language: z.enum(LOCALES),
});

/** Deterministic synthetic demo response. Never selected for production/live model mode. */
export const replayModel: ModelPort = async (request, signal) => {
  signal.throwIfAborted();
  const message = request.messages.at(-1);
  if (!message) throw new ModelFailure('invalid-response');
  const raw: unknown = JSON.parse(message.content);
  const forecast = forecastInput.safeParse(raw);
  if (forecast.success) {
    const { kind: _kind, market, language, ...identity } = forecast.data;
    const t = translator(language);
    // Points are shown with what this snapshot has: a recorded market has the indicators, a synthetic one only prices.
    const has = (path: string) => hasEvidencePath(market, path);
    const claims: Record<string, string> = t('replay.points', { returnObjects: true });
    const point = (
      key: string,
      stance: Point['stance'],
      horizons: Point['horizons'],
      show: Exhibit,
    ): Point => ({
      claim: claims[key] ?? key,
      stance,
      weight: stance === 'up' ? 'high' : 'medium',
      horizons,
      show,
    });
    const shock = 'engineered_features.event_shock.shock_multiple_5m';
    const points: Point[] = [
      ...(numberAt(market, shock) !== null
        ? [point('shock', 'up', [5, 15], { kind: 'ratio', path: shock })]
        : []),
      point('volume', 'up', [5, 15], { kind: 'price', minutes: 30, span: 5, volume: true, levels: [] }),
      ...(has('technical_indicators.rsi.current')
        ? [point('rsi', 'up', [5, 15, 30], { kind: 'scale', indicator: 'rsi' })]
        : []),
      ...(numberAt(market, 'engineered_features.market_relative.breadth_up_5m') !== null
        ? [point('breadth', 'up', [5, 15, 30], { kind: 'breadth', minutes: 5 })]
        : []),
      point('hour', 'down', [60], { kind: 'price', minutes: 60, span: null, volume: false, levels: [] }),
      ...(has('technical_indicators.bollinger.current')
        ? [
            point('band', 'down', [5, 15], {
              kind: 'price',
              minutes: 30,
              span: null,
              volume: false,
              levels: ['bollinger_upper', 'bollinger_middle'],
            }),
          ]
        : []),
    ];
    const odds = {
      5: [0.7, 0.1, 0.2],
      15: [0.6, 0.2, 0.2],
      30: [0.5, 0.2, 0.3],
      60: [0.3, 0.4, 0.3],
    } as const;
    const moves = {
      5: [0.3, -0.3, 0.27, 0.94],
      15: [0.41, -0.55, 0.36, 1.3],
      30: [0.22, -0.95, 0.18, 1.45],
      60: [0.05, -1.5, 0.02, 1.6],
    } as const;
    const content = forecastSchema.parse({
      ...identity,
      schemaVersion: '2',
      horizons: ([5, 15, 30, 60] as const).map((horizon) => ({
        horizon,
        probabilities: { up: odds[horizon][0], flat: odds[horizon][1], down: odds[horizon][2] },
        expectedReturnPct: moves[horizon][0],
        quantiles: { q10: moves[horizon][1], q50: moves[horizon][2], q90: moves[horizon][3] },
      })),
      trade: { action: 'LONG', sizePct: 10, horizon: 5, stopPct: 1, targetPct: 2 },
      rationale: {
        headline: t('replay.headline'),
        thesis: t('replay.thesis'),
        horizons: [{ horizon: 60, note: t('replay.hour') }],
        points,
        invalidation: has('technical_indicators.bollinger.current')
          ? { when: 'below', level: 'bollinger_middle' }
          : null,
        chart: [],
      },
    });
    return {
      content: JSON.stringify(content),
      model: 'replay-fixture-v1',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    };
  }
  const input = responseInput.parse(raw);
  const trade = input.forecast?.trade;
  const proposed =
    trade && trade.action !== 'FLAT' && input.topic !== 'general'
      ? {
          instrument: input.topic,
          side: trade.action,
          amount: D.min(input.preferences.maxTradeUsd, new D(input.portfolio.capital).mul(0.1)).toFixed(8),
          stopPct: trade.stopPct,
          targetPct: trade.targetPct,
          horizon: trade.horizon,
        }
      : input.reviseProposal;
  const t = translator(input.language);
  const content = replySchema.parse({
    text: t(proposed ? 'replay.idea' : 'replay.note'),
    proposal: input.portfolio.currentOrder ? null : proposed,
    followUps: t('replay.next', { returnObjects: true }),
  });
  return {
    content: JSON.stringify(content),
    model: 'replay-fixture-v1',
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
  };
};

/** What a live model has sent of a forecast as it writes it: the horizons one by one, the trade, then why. */
const forecastParts = (forecast: Record<string, unknown>): unknown[] => {
  const { horizons, trade, rationale, ...head } = forecast;
  if (!Array.isArray(horizons)) return [];
  const words = (text: unknown) => (typeof text === 'string' ? text.split(/(?<=\s)/) : []);
  const { headline, thesis } = (rationale ?? {}) as { headline?: unknown; thesis?: unknown };
  const typed = (said: readonly string[], n: number) => said.slice(0, n + 1).join('');
  return [
    head,
    ...horizons.map((_, n) => ({ ...head, horizons: horizons.slice(0, n + 1) })),
    { ...head, horizons, trade },
    ...words(headline).map((_, n, said) => ({
      ...head,
      horizons,
      trade,
      rationale: { headline: typed(said, n) },
    })),
    ...words(thesis).map((_, n, said) => ({
      ...head,
      horizons,
      trade,
      rationale: { headline, thesis: typed(said, n) },
    })),
  ];
};

/**
 * The replay model typing its answer: a streamed call gets the text of an answer a word at a time, `ms` apart, as a
 * live model would send it, so the conversation can be seen writing offline, and a forecast part by part. With
 * `thinkMs` it also takes the pauses a live model takes: it reads the market before the first word of a forecast, and
 * weighs each term and the trade before writing them, so the wait for an analysis shows all its steps. An unstreamed
 * call is answered at once.
 */
export const typingModel =
  (model: ModelPort, ms: number, thinkMs = 0): ModelPort =>
  async (request, signal, onPartial) => {
    const result = await model(request, signal);
    if (!onPartial || (ms <= 0 && thinkMs <= 0)) return result;
    let answer: Record<string, unknown>;
    try {
      answer = JSON.parse(result.content) as Record<string, unknown>;
    } catch {
      return result;
    }
    const pause = async (wait: number) => {
      if (wait > 0) await new Promise((done) => setTimeout(done, wait));
      signal.throwIfAborted();
    };
    if (typeof answer.text === 'string') {
      await pause(Math.round(thinkMs / 4));
      for (const part of answer.text
        .split(/(?<=\s)/)
        .map((_, n, words) => ({ text: words.slice(0, n + 1).join('') }))) {
        onPartial(part);
        await pause(ms);
      }
      return result;
    }
    const [head, ...parts] = forecastParts(answer);
    if (head === undefined) return result;
    onPartial(head);
    await pause(thinkMs);
    const terms = Array.isArray(answer.horizons) ? answer.horizons.length : 0;
    for (const [n, part] of parts.entries()) {
      onPartial(part);
      if (n < terms) await pause(Math.round(thinkMs / 12));
      else if (n === terms) await pause(Math.round(thinkMs / 8));
      else await pause(ms);
    }
    return result;
  };
