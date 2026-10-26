import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as market from '../modules/market/index.js';
import * as runtime from '../modules/runtime/index.js';
import * as trading from '../modules/trading/index.js';
import { replayClock } from '../platform/clock.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId, newToken, payloadHash, sha256 } from '../platform/identity.js';
import { advanceBroker } from '../workflows/advance-broker.js';
import { changeBrokerVersion } from '../workflows/change-broker-version.js';
import { confirmProposal } from '../workflows/confirm-proposal.js';
import { createGuest } from '../workflows/create-guest.js';
import type { Deps } from '../workflows/deps.js';
import { dispatchMarketEvent } from '../workflows/dispatch-market-event.js';
import { executeOrder } from '../workflows/execute-order.js';
import { resolveForecast } from '../workflows/resolve-forecast.js';
import { respond } from '../workflows/respond.js';
import { runForecast } from '../workflows/run-forecast.js';
import { sendMessageInTransaction } from '../workflows/send-message.js';
import { settlePosition } from '../workflows/settle-position.js';
import { scenarioModel } from './model.js';
import { scenarioSchema } from './scenario.js';

/** A disposable database and explicit task times; no polling, network providers or queue consumers. */
export async function runScenario(ports: Omit<Deps, 'clock'>, raw: unknown) {
  const scenario = scenarioSchema.parse(raw);
  if (
    ports.config.NODE_ENV !== 'test' ||
    ports.config.MARKET_MODE !== 'replay' ||
    ports.config.MODEL_MODE !== 'replay'
  )
    throw new Error('Workflow replay requires an isolated test/replay environment');
  if ((await broker.listBrokers(ports.db)).length || (await market.listEvents(ports.db)).length)
    throw new Error('Workflow replay requires an empty database');
  await runtime.bindEnvironment(ports.db, 'replay');
  const clock = replayClock(scenario.startAt);
  // A scenario plays signals to a broker who reads them by himself.
  const deps: Deps = { ...ports, clock, config: { ...ports.config, AUTO_ANALYSIS: 'on' } };
  const owner = await createGuest(deps, newToken(), 'ru');
  const personal = owner.broker!;
  // The trades of a scenario are five minutes long, which is how a scalper trades.
  const { preferences } = await broker.loadHead(deps.db, personal.id);
  await inTransaction(deps.db, (tx) =>
    broker.setPreferences(tx, personal.id, { ...preferences, mode: 'scalper' }),
  );
  const model = scenarioModel(scenario.model);
  const snapshots = new Map<string, market.Snapshot>();
  const events = new Map<string, string>();
  const proposals = new Map<string, string>();
  const trace: { key: string; at: number; kind: string; result: string }[] = [];

  async function background() {
    await advanceBroker(deps, personal.id);
    const account = (await trading.findAccount(deps.db, owner.user.id, 'user'))!;
    const head = await trading.loadHead(deps.db, account.id);
    if (head.currentOrderId) {
      await executeOrder(deps, head.currentOrderId);
      const executions = await trading.listExecutions(deps.db, head.currentOrderId);
      if (executions.some((e) => e.kind === 'entry') && !executions.some((e) => e.kind === 'exit'))
        await settlePosition(deps, head.currentOrderId);
    }
    for (const value of await forecast.listBrokerForecasts(deps.db, personal.id))
      await resolveForecast(deps, value.id);
  }
  async function reply(key: string, entryId: string) {
    const result = await respond(deps, model.port, entryId);
    if (result.kind === 'responded' && result.proposalVersion) proposals.set(key, result.proposalVersion.id);
    return result.kind;
  }
  for (const step of scenario.steps) {
    clock.set(step.at);
    let result: string;
    switch (step.kind) {
      case 'market': {
        const fresh: string[] = [];
        await inTransaction(deps.db, async (tx) => {
          await market.recordCandles(tx, step.candles, step.at);
          for (const s of step.snapshots) {
            const hash = sha256(s.raw);
            const value: market.Snapshot = {
              id: `scenario:${hash}`,
              instrument: s.instrument,
              cutoffAt: s.cutoffAt,
              raw: s.raw,
              body: JSON.parse(s.raw),
              inputHash: hash,
              quality: 'valid',
              receivedAt: step.at,
            };
            await market.recordSnapshot(tx, value);
            snapshots.set(s.key, value);
          }
          for (const event of step.events) {
            const s = snapshots.get(event.snapshot)!;
            const id = `scenario:${event.key}`;
            await market.recordEvent(tx, {
              id,
              snapshotId: s.id,
              instrument: s.instrument,
              barEnd: event.barEnd,
              receivedAt: step.at,
              body: event.body,
            });
            events.set(event.key, id);
            fresh.push(id);
          }
        });
        for (const id of fresh) await dispatchMarketEvent(deps, id);
        result = 'recorded';
        break;
      }
      case 'configure': {
        const head = await broker.loadHead(deps.db, personal.id);
        result = (
          await changeBrokerVersion(deps, owner.user.id, {
            baseVersionId: head.versionId,
            prompt: step.prompt,
            model: deps.config.OPENROUTER_MODEL,
            note: 'Replay scenario',
            requestId: newId(),
          })
        ).kind;
        if (result === 'saved' && step.markets)
          await inTransaction(deps.db, async (tx) => {
            await lock(tx, 'broker', personal.id);
            const current = await broker.loadHead(tx, personal.id);
            await broker.setPreferences(tx, personal.id, { ...current.preferences, markets: step.markets! });
          });
        break;
      }
      case 'forecast': {
        const dispatch = await forecast.findEventDispatch(deps.db, personal.id, events.get(step.event)!);
        if (!dispatch) {
          result = 'not-dispatched';
          break;
        }
        result = (await runForecast(deps, model.port, dispatch.id)).kind;
        break;
      }
      case 'discuss-forecast': {
        const dispatch = await forecast.findEventDispatch(deps.db, personal.id, events.get(step.event)!);
        const value = dispatch ? await forecast.findSubmission(deps.db, dispatch.id) : null;
        if (!dispatch || !value) {
          result = 'forecast-missing';
          break;
        }
        const entry = await conversation.findSourceEntry(
          deps.db,
          dispatch.conversationId,
          'forecast',
          value.id,
        );
        if (!entry) throw new Error('Replay forecast entry missing');
        result = await reply(step.key, entry.id);
        break;
      }
      case 'message': {
        const chat = await inTransaction(deps.db, (tx) =>
          conversation.ensureConversation(tx, owner.user.id, personal.id, step.topic),
        );
        const revision = step.reviseFrom ? proposals.get(step.reviseFrom) : null;
        if (step.reviseFrom && !revision) {
          result = 'proposal-missing';
          break;
        }
        const sent = await inTransaction(deps.db, (tx) =>
          sendMessageInTransaction(deps, tx, owner.user.id, {
            conversationId: chat.id,
            text: step.text,
            requestId: newId(),
            reviseProposalVersionId: revision ?? null,
          }),
        );
        result = sent.kind === 'sent' ? await reply(step.key, sent.entry.id) : sent.reason;
        break;
      }
      case 'decide': {
        const versionId = proposals.get(step.proposalFrom);
        if (!versionId) {
          result = 'proposal-missing';
          break;
        }
        const decision = await confirmProposal(deps, owner.user.id, { versionId, decision: step.decision });
        result =
          decision.kind === 'rejected' ? decision.reason : decision.replayed ? 'replayed' : decision.kind;
        break;
      }
      case 'tick':
        result = 'tick';
        break;
      default: {
        const exhaustive: never = step;
        throw new Error(`Unsupported scenario step: ${exhaustive}`);
      }
    }
    if (step.work) await background();
    trace.push({ key: step.key, at: step.at, kind: step.kind, result });
  }
  clock.set(scenario.endAt);
  await background();
  const accounts = [];
  for (const kind of ['broker', 'user'] as const) {
    const account = (await trading.findAccount(deps.db, owner.user.id, kind))!;
    const head = await trading.loadHead(deps.db, account.id);
    const orders = [];
    for (const order of await trading.listOrders(deps.db, account.id)) {
      const executions = await trading.listExecutions(deps.db, order.id);
      orders.push({
        source: order.sourceKind,
        terms: order.terms,
        entryAt: order.entryAt,
        executions: executions
          .map((e) => {
            const { referenceCandleId: _reference, candleIds: _candles, ...body } = e.body;
            return { kind: e.kind, body };
          })
          .sort((a, b) => a.kind.localeCompare(b.kind)),
      });
    }
    accounts.push({
      kind,
      capital: head.capital,
      pending: head.currentOrderId !== null,
      orders: orders.sort((a, b) => a.entryAt - b.entryAt),
    });
  }
  const predictions = [];
  for (const value of await forecast.listBrokerForecasts(deps.db, personal.id)) {
    const dispatch = (await forecast.findDispatch(deps.db, value.dispatchId))!;
    const version = (await broker.findVersion(deps.db, value.versionId))!;
    const scores = (await forecast.listResolutions(deps.db, value.id))
      .map((r) => r.score)
      .sort((a, b) => a.horizon - b.horizon);
    predictions.push({
      event: dispatch.eventId,
      version: version.number,
      cohort: value.cohort,
      environment: dispatch.environment,
      receivedAt: value.receivedAt,
      t0: dispatch.t0,
      horizons: value.body.horizons,
      trade: value.body.trade,
      scores,
    });
  }
  const journal = [];
  for (const chat of await conversation.listConversations(deps.db, owner.user.id)) {
    const entries = await conversation.readEntries(deps.db, chat.id, 0, 10000);
    journal.push({
      topic: chat.topic,
      entries: entries.map((e) => ({
        seq: e.seq,
        kind: e.kind,
        at: e.createdAt,
        text: typeof e.body.text === 'string' ? e.body.text : null,
      })),
    });
  }
  return {
    schemaVersion: 'workflow-replay-report-1',
    scenarioHash: payloadHash(scenario),
    source: scenario.source,
    virtualStart: scenario.startAt,
    virtualEnd: scenario.endAt,
    model: model.usage(),
    trace,
    accounts,
    predictions: predictions.sort((a, b) => a.t0 - b.t0 || (a.event ?? '').localeCompare(b.event ?? '')),
    journal: journal.sort((a, b) => a.topic.localeCompare(b.topic)),
  };
}
