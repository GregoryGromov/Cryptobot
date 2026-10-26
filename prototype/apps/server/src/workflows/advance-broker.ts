import { D } from '../kernel/money.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as forecast from '../modules/forecast/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';
import { executeOrderInTransaction } from './execute-order.js';
import { settlePositionInTransaction } from './settle-position.js';

async function advancePosition(deps: Deps, tx: Tx, accountId: string, until: number) {
  const head = await trading.loadHead(tx, accountId);
  if (!head.currentOrderId) return true;
  const executed = await executeOrderInTransaction(deps, tx, head.currentOrderId, until, false);
  if (executed.kind === 'unresolved' || executed.kind === 'waiting') return false;
  if ((await trading.listExecutions(tx, head.currentOrderId)).some((e) => e.kind === 'rejected')) return true;
  return (
    (await settlePositionInTransaction(deps, tx, head.currentOrderId, until, false)).kind !== 'unresolved'
  );
}

/** One chronological owner of the broker account, including entry and settlement. */
export async function advanceBroker(deps: Deps, brokerId: string) {
  return inTransaction(deps.db, async (tx) => {
    // Dispatch and acceptance take this same lock: at T0 no candidate can still become official.
    await lock(tx, 'broker', brokerId);
    const personal = await broker.findBrokerById(tx, brokerId);
    const account = personal ? await trading.findAccount(tx, personal.userId, 'broker') : undefined;
    if (!personal || !account) throw new Error('Broker account missing');
    await lock(tx, 'trading-account', account.id);
    const now = deps.clock.now();
    const candidates = (await forecast.listDispatches(tx, brokerId))
      .filter((d) => d.origin === 'event' && d.t0 <= now)
      .sort(
        (a, b) =>
          a.t0 - b.t0 || (a.eventId! < b.eventId! ? -1 : a.eventId! > b.eventId! ? 1 : a.id < b.id ? -1 : 1),
      );
    const admissions = new Map(
      (await trading.listBrokerAdmissions(tx, account.id)).map((a) => [a.dispatchId, a]),
    );
    // Freeze all admissions before touching capital. A delayed/invalid response cannot later win a slot.
    for (const dispatch of candidates) {
      if (admissions.has(dispatch.id)) continue;
      const value = await forecast.findSubmission(tx, dispatch.id);
      const admission = {
        dispatchId: dispatch.id,
        accountId: account.id,
        forecastId: value?.cohort === 'official' ? value.id : null,
        createdAt: now,
      };
      await trading.recordBrokerAdmission(tx, admission);
      admissions.set(dispatch.id, admission);
    }
    const wait = async () => {
      await enqueue(deps.jobs, tx, 'broker.advance', brokerId, now + 15000);
      return { kind: 'waiting' } as const;
    };
    for (const dispatch of candidates) {
      if (await trading.findBrokerResult(tx, dispatch.id)) continue;
      const admitted = admissions.get(dispatch.id)!;
      const value = admitted.forecastId ? await forecast.findForecast(tx, admitted.forecastId) : undefined;
      let kind: 'non-official' | 'flat' | 'account-busy' | 'ordered' = 'non-official';
      let orderId: string | null = null;
      if (value) {
        if (dispatch.executionVersion !== trading.EXECUTION_RULES.version)
          throw new Error('Unsupported execution rules');
        if (!(await advancePosition(deps, tx, account.id, dispatch.t0))) return wait();
        const head = await trading.loadHead(tx, account.id);
        const plan = value.body.trade;
        if (plan.action === 'FLAT') kind = 'flat';
        else if (head.currentOrderId) kind = 'account-busy';
        else {
          const rules = trading.rulesFor('lower');
          // A 100% allocation reserves the entry commission within that allocation.
          const amount = new D(head.capital)
            .mul(plan.sizePct)
            .div(100)
            .div(new D(1).plus(rules.feeRate))
            .toDecimalPlaces(8, D.ROUND_DOWN)
            .toFixed(8);
          const order: trading.Order = {
            id: newId(),
            accountId: account.id,
            cycleId: head.cycleId,
            sourceKind: 'forecast',
            sourceId: value.id,
            versionId: value.versionId,
            terms: {
              instrument: dispatch.instrument,
              side: plan.action,
              amount,
              stopPct: plan.stopPct,
              targetPct: plan.targetPct,
              horizon: plan.horizon,
            },
            entryAt: dispatch.t0,
            rules,
            createdAt: now,
          };
          await trading.recordOrder(tx, order);
          orderId = order.id;
          kind = 'ordered';
        }
      }
      await trading.recordBrokerResult(tx, {
        dispatchId: dispatch.id,
        kind,
        orderId,
        rulesVersion: dispatch.executionVersion,
        createdAt: now,
      });
      await conversation.appendEntry(tx, {
        id: newId(),
        conversationId: dispatch.conversationId,
        kind: 'broker-execution',
        sourceId: dispatch.id,
        body: { dispatchId: dispatch.id, forecastId: admitted.forecastId, kind, orderId, t0: dispatch.t0 },
        createdAt: now,
      });
    }
    if (!(await advancePosition(deps, tx, account.id, now))) return wait();
    if ((await trading.loadHead(tx, account.id)).currentOrderId) return wait();
    return { kind: 'advanced' } as const;
  });
}
