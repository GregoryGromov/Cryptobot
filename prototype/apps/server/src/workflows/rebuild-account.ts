import { decimalSchema, instantSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { D, usd } from '../kernel/money.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock } from '../platform/db.js';
import type { Deps } from './deps.js';

const entrySchema = z.object({ at: instantSchema });
const exitSchema = z.object({ at: instantSchema, pnl: decimalSchema });

/** Administrative repair: replay persisted execution facts, never substitute today's market revision. */
export async function rebuildAccount(deps: Pick<Deps, 'db'>, accountId: string) {
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'trading-account', accountId);
    const account = await trading.findAccountById(tx, accountId);
    if (!account) throw new Error('Account missing');
    const cycle = (await trading.listCycles(tx, accountId))[0];
    if (!cycle) throw new Error('Cycle missing');
    const orders = (await trading.listOrders(tx, accountId)).filter((o) => o.cycleId === cycle.id);
    let capital = new D(cycle.startCapital);
    let asOf = cycle.createdAt;
    let currentOrderId: string | null = null;
    for (const order of orders) {
      const executions = await trading.listExecutions(tx, order.id);
      const entry = executions.find((e) => e.kind === 'entry');
      const exit = executions.find((e) => e.kind === 'exit');
      const rejected = executions.some((e) => e.kind === 'rejected');
      if (entry) asOf = Math.max(asOf, entrySchema.parse(entry.body).at);
      if (exit) {
        const fill = exitSchema.parse(exit.body);
        capital = capital.plus(fill.pnl);
        asOf = Math.max(asOf, fill.at);
      } else if (rejected) asOf = Math.max(asOf, order.entryAt);
      else {
        if (currentOrderId) throw new Error('Facts contain overlapping reservations');
        currentOrderId = order.id;
      }
    }
    const head = { accountId, cycleId: cycle.id, capital: usd(capital), currentOrderId, asOf };
    await trading.replaceHead(tx, head);
    return head;
  });
}
