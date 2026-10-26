// The assistant as an agent: before it answers, the model may ask for data the question needs and the conversation's
// input does not hold — any market over any span, how its own forecasts came out. To the rest of the platform the
// whole loop is one model call: one run, one budget, one retry, one answer; actions are carried out by `respond` after
// the answer is recorded, exactly as a form answer's are, so a run tried again does not repeat them.

import { type Horizon, replySchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { ModelFailure, type ModelPort, type ModelRequest, type ModelResult } from '../adapters/model.js';
import type { OwnModelPort } from '../adapters/xai-model.js';
import { MINUTE } from '../kernel/time.js';
import * as forecast from '../modules/forecast/index.js';
import type { Config } from '../platform/config.js';
import { logger } from '../platform/log.js';
import { spanCandles } from './chart-candles.js';
import type { Deps } from './deps.js';
import { coinNamed, wallClock } from './market-brief.js';

/** The agent answers only with a live model: the replay model writes form answers. */
export const agentEnabled = (config: Config): boolean =>
  config.ASSISTANT_AGENT === 'on' && config.MODEL_MODE === 'live';

const tickerSchema = z.string().trim().min(1).max(40);
const lookSchema = z.union([
  z
    .strictObject({
      tool: z.literal('market'),
      market: tickerSchema.describe('Ticker as the markets field shows it, e.g. ETH or GOLD.'),
      hours: z.number().int().min(1).max(720).describe('How many hours back from now.'),
    })
    .describe('Candles of any market over the last hours, up to 30 days, with its move, high and low.'),
  z
    .strictObject({
      tool: z.literal('record'),
      market: tickerSchema.nullable().describe('Ticker, or null for every market.'),
    })
    .describe("How many of your forecasts on the person's term came true, with the latest of them."),
]);
type Look = z.infer<typeof lookSchema>;

export const agentReplySchema = replySchema.extend({
  analyze: z
    .boolean()
    .describe(
      "Start an analysis of the conversation's market, as its «Разобрать» button does; the forecast comes separately.",
    ),
});
export type AgentReply = z.infer<typeof agentReplySchema>;
/** One step of the loop: what to read before answering, or the answer. */
export const agentStepSchema = z.strictObject({
  look: z.array(lookSchema).max(4).describe('Data to read before answering; empty when you answer now.'),
  reply: agentReplySchema.nullable().describe('The answer; null while you are still reading.'),
});
/** The last step: no more reading. */
const finalStepSchema = z.strictObject({ look: z.array(lookSchema).max(0), reply: agentReplySchema });
const STEP_SCHEMA = z.toJSONSchema(agentStepSchema);
const FINAL_SCHEMA = z.toJSONSchema(finalStepSchema);
export const agentSchema = () => STEP_SCHEMA;

/** What the loop hands back as the run's output: the answer and what was read on the way to it. */
export const agentOutputSchema = z.strictObject({
  reply: agentReplySchema,
  steps: z.array(z.strictObject({ look: z.array(lookSchema), ms: z.number() })),
});

export const agentRules = (
  steps: number,
) => `Данные по запросу. Сначала посмотри, хватает ли того, что уже есть в user. Если не хватает — запроси в look (до 4 запросов за шаг) и оставь reply=null:
- market — свечи и изменение любого рынка за последние hours часов (до 720). Нужен, когда спрашивают о прошлом без выделенного куска (span), о других рынках или о сроке длиннее двух часов.
- record — сколько твоих прогнозов на срок человека сбылось: по рынку или по всем.
Результаты придут следующим сообщением (kind=tool-results), числа бери из них. Всего не больше ${steps} шагов; когда данных хватает, заполни reply и оставь look пустым. Не запрашивай то, что уже есть в user.
analyze=true запускает разбор рынка этого разговора, как кнопка «Разобрать»: человек увидит карточку разбора, прогноз и пояснение придут отдельно. Ставь его, когда человек спрашивает, входить ли, что будет дальше или просит разобрать рынок; тогда не делай вывода о входе сам и не предлагай сделку — скажи коротко, что разбор пошёл. Если topic=broker или turn — твой прогноз, analyze=false.`;

export type AgentContext = {
  brokerId: string;
  /** The markets the model may name: the brief's, the conversation's own first. */
  coins: readonly string[];
  timezone: string;
  horizon: Horizon;
  locale: string;
};

const ticker = (coin: string) => coin.replace(/^xyz:/, '');
const pct = (from: number, to: number) => Number(((to / from - 1) * 100).toFixed(2));

async function marketLook(deps: Deps, ctx: AgentContext, name: string, hours: number) {
  const coin = coinNamed(ctx.coins, name);
  if (!coin) return { market: name, error: 'unknown-market' };
  const now = deps.clock.now();
  const { frame, candles } = await spanCandles(deps, coin, { from: now - hours * 60 * MINUTE, to: now }, 48);
  const first = candles[0];
  const last = candles.at(-1);
  if (!first || !last) return { market: ticker(coin), hours, error: 'no-candles' };
  const high = candles.reduce((a, c) => (c.h > a.h ? c : a));
  const low = candles.reduce((a, c) => (c.l < a.l ? c : a));
  return {
    market: ticker(coin),
    hours,
    from: wallClock(ctx.timezone, first.t),
    to: wallClock(ctx.timezone, last.t),
    open: first.o,
    close: last.c,
    changePct: pct(first.o, last.c),
    high: { price: high.h, at: wallClock(ctx.timezone, high.t) },
    low: { price: low.l, at: wallClock(ctx.timezone, low.t) },
    frame,
    columns: ['openedAt', 'open', 'high', 'low', 'close', 'volume'],
    candles: candles.map((c) => [wallClock(ctx.timezone, c.t), c.o, c.h, c.l, c.c, c.v]),
  };
}

const RECORD_FORECASTS = 200;
const RECORD_LATEST = 10;
const leanOf = (p: { up: number; flat: number; down: number }) => {
  const sorted = (Object.entries(p) as ['up' | 'flat' | 'down', number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0] && sorted[1] && sorted[0][1] > sorted[1][1] ? sorted[0][0] : null;
};

async function recordLook(deps: Deps, ctx: AgentContext, name: string | null) {
  const coin = name ? coinNamed(ctx.coins, name) : null;
  if (name && !coin) return { market: name, error: 'unknown-market' };
  const dispatches = new Map((await forecast.listDispatches(deps.db, ctx.brokerId)).map((d) => [d.id, d]));
  const submissions = (await forecast.listBrokerForecasts(deps.db, ctx.brokerId))
    .filter((f) => !coin || dispatches.get(f.dispatchId)?.instrument === coin)
    .slice(0, RECORD_FORECASTS);
  let checked = 0;
  let hits = 0;
  let waiting = 0;
  const latest: unknown[] = [];
  for (const f of submissions) {
    const dispatch = dispatches.get(f.dispatchId);
    const call = f.body.horizons.find((h) => h.horizon === ctx.horizon);
    if (!dispatch || !call) continue;
    const resolution = (await forecast.listResolutions(deps.db, f.id)).find(
      (r) => r.horizon === ctx.horizon && r.rulesVersion === dispatch.scoringVersion,
    );
    const lean = leanOf(call.probabilities);
    if (!resolution) {
      if (dispatch.t0 + ctx.horizon * MINUTE > deps.clock.now()) waiting++;
      continue;
    }
    const hit = lean === resolution.score.outcome;
    checked++;
    if (hit) hits++;
    if (latest.length < RECORD_LATEST)
      latest.push({
        market: ticker(dispatch.instrument),
        at: wallClock(ctx.timezone, f.receivedAt),
        call: lean,
        came: resolution.score.outcome,
        hit,
      });
  }
  return { market: coin ? ticker(coin) : null, termMin: ctx.horizon, checked, hits, waiting, latest };
}

async function lookUp(deps: Deps, ctx: AgentContext, look: Look) {
  try {
    return look.tool === 'market'
      ? await marketLook(deps, ctx, look.market, look.hours)
      : await recordLook(deps, ctx, look.market);
  } catch (error) {
    logger.warn({ err: error, tool: look.tool }, 'agent-look-failed');
    return { tool: look.tool, error: 'unavailable' };
  }
}

/** What the conversation shows while the agent reads, in place of the answer it has not begun to write. */
function reading(looks: readonly Look[], locale: string): string {
  const en = locale === 'en';
  const span = (hours: number) =>
    hours < 48
      ? en
        ? `${hours} h`
        : `${hours} ч`
      : en
        ? `${Math.round(hours / 24)} days`
        : `${Math.round(hours / 24)} дн.`;
  const parts = looks.map((look) =>
    look.tool === 'market'
      ? `$${look.market.replace(/^\$/, '')} ${en ? 'over' : 'за'} ${span(look.hours)}`
      : en
        ? 'how my forecasts came out'
        : 'сколько прогнозов сбылось',
  );
  return `${en ? 'Looking at' : 'Смотрю'} ${parts.join(', ')}…`;
}

const lenientStep = z.object({
  look: z.array(lookSchema).default([]),
  reply: agentReplySchema.nullable().default(null),
});

type Call = (request: ModelRequest, onPartial?: (partial: unknown) => void) => Promise<ModelResult>;

/**
 * The loop: each step is one call of the model in its own form, `agentStepSchema`; what it asks to read is read and
 * sent back with everything before it. The last step allowed, or a step past `budgetMs`, can only answer.
 */
export async function runAgent(
  deps: Deps,
  ctx: AgentContext,
  call: Call,
  request: ModelRequest,
  options: { maxSteps: number; budgetMs: number; onPartial?: ((partial: unknown) => void) | undefined },
): Promise<ModelResult> {
  const started = Date.now();
  const messages = [...request.messages];
  const steps: { look: Look[]; ms: number }[] = [];
  const total = { inputTokens: 0, outputTokens: 0, cost: 0, tokens: true, priced: true };
  let model = request.model;
  for (let n = 1; n <= options.maxSteps; n++) {
    const last = n === options.maxSteps || Date.now() - started > options.budgetMs;
    const stepStarted = Date.now();
    const result = await call(
      {
        ...request,
        schema: last ? FINAL_SCHEMA : STEP_SCHEMA,
        messages: last
          ? [...messages, { role: 'user', content: 'Больше данных не будет: ответь сейчас, заполни reply.' }]
          : messages,
      },
      options.onPartial &&
        ((partial) => {
          const text = (partial as { reply?: { text?: unknown } } | null)?.reply?.text;
          if (typeof text === 'string') options.onPartial?.({ text });
        }),
    );
    model = result.model;
    if (result.inputTokens === null || result.outputTokens === null) total.tokens = false;
    else {
      total.inputTokens += result.inputTokens;
      total.outputTokens += result.outputTokens;
    }
    if (result.cost === null) total.priced = false;
    else total.cost += result.cost;
    let step: z.infer<typeof lenientStep>;
    try {
      step = lenientStep.parse(JSON.parse(result.content));
    } catch {
      throw new ModelFailure('invalid-response');
    }
    logger.info(
      { step: n, look: step.look, answered: Boolean(step.reply), ms: Date.now() - stepStarted },
      'agent-step',
    );
    if (step.reply)
      return {
        content: JSON.stringify(agentOutputSchema.parse({ reply: step.reply, steps })),
        model,
        inputTokens: total.tokens ? total.inputTokens : null,
        outputTokens: total.tokens ? total.outputTokens : null,
        cost: total.priced ? total.cost : null,
      };
    if (last) throw new ModelFailure('invalid-response');
    if (step.look.length) options.onPartial?.({ text: reading(step.look, ctx.locale) });
    const results = await Promise.all(step.look.map((look) => lookUp(deps, ctx, look)));
    steps.push({ look: step.look, ms: Date.now() - stepStarted });
    messages.push(
      { role: 'assistant', content: result.content },
      {
        role: 'user',
        content: step.look.length
          ? JSON.stringify({ kind: 'tool-results', results })
          : 'Пустой шаг: либо запроси данные в look, либо ответь в reply.',
      },
    );
  }
  throw new ModelFailure('invalid-response');
}

/** The platform's model, answering through the loop. */
export const agentPort =
  (deps: Deps, ctx: AgentContext, port: ModelPort, maxSteps: number): ModelPort =>
  (request, signal, onPartial, attempt) =>
    runAgent(deps, ctx, (r, partial) => port(r, signal, partial, attempt), request, {
      maxSteps,
      budgetMs: deps.config.MODEL_TIMEOUT_MS * 0.6,
      onPartial,
    });

/** A user's own Grok, answering through the loop. */
export const agentOwnModel =
  (deps: Deps, ctx: AgentContext, own: OwnModelPort, maxSteps: number): OwnModelPort =>
  (request, auth, signal) =>
    runAgent(deps, ctx, (r) => own(r, auth, signal), request, {
      maxSteps,
      budgetMs: deps.config.MODEL_TIMEOUT_MS * 0.6,
    });
