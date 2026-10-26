import { D } from '../kernel/money.js';
import type { Estimate } from './view-types.js';

/** Display-only estimate shared by broker cards and the editable manual ticket. */
export function tradePreview(
  terms: { side: 'LONG' | 'SHORT'; amount: string | number; stopPct: number; targetPct: number },
  reference: number,
  rules: { feeRate: string | number; slippageBps: number },
): Omit<Estimate, 'entryAt' | 'exitBy'> {
  const direction = terms.side === 'LONG' ? 1 : -1;
  const entry = new D(reference).mul(new D(1).plus(new D(rules.slippageBps).div(10000).mul(direction)));
  const amount = new D(terms.amount);
  const quantity = amount.div(entry);
  const entryFee = amount.mul(rules.feeRate);
  const stop = new D(reference).mul(new D(1).minus(new D(terms.stopPct).div(100).mul(direction)));
  const target = new D(reference).mul(new D(1).plus(new D(terms.targetPct).div(100).mul(direction)));
  const pnl = (level: InstanceType<typeof D>) => {
    const exit = level.mul(new D(1).minus(new D(rules.slippageBps).div(10000).mul(direction)));
    return exit
      .minus(entry)
      .mul(quantity)
      .mul(direction)
      .minus(entryFee)
      .minus(exit.mul(quantity).mul(rules.feeRate))
      .toNumber();
  };
  return {
    price: reference,
    entryPrice: entry.toNumber(),
    slippageBps: rules.slippageBps,
    entryFee: entryFee.toNumber(),
    roundTripFee: entryFee.mul(2).toNumber(),
    stopPrice: stop.toNumber(),
    takePrice: target.toNumber(),
    lossAtStop: -pnl(stop),
    gainAtTake: pnl(target),
  };
}
