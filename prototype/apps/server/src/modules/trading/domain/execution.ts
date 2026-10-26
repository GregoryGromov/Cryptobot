import type { Candle, CandleSlot, ProposalTerms } from '@reinforce/harness-contract';
import { D, price, usd } from '../../../kernel/money.js';
import { MINUTE } from '../../../kernel/time.js';

export const EXECUTION_RULES = {
  version: 'execution-1-provisional',
  feeRate: '0.00045',
  slippageBps: { high: 2, medium: 5, lower: 10 },
  startCapital: '10000.00000000',
  funding: 'disabled',
} as const;
export type Liquidity = keyof typeof EXECUTION_RULES.slippageBps;
export type ExecutionRules = { version: string; feeRate: string; slippageBps: number };
export const rulesFor = (liquidity: Liquidity): ExecutionRules => ({
  version: EXECUTION_RULES.version,
  feeRate: EXECUTION_RULES.feeRate,
  slippageBps: EXECUTION_RULES.slippageBps[liquidity],
});
export type OpenFill = {
  at: number;
  referencePrice: string;
  price: string;
  amount: string;
  quantity: string;
  fee: string;
  stop: string;
  target: string;
  candleRevision: string;
  rules: ExecutionRules;
};
export type CloseFill = {
  at: number;
  referencePrice: string;
  price: string;
  fee: string;
  pnl: string;
  reason: 'stop-loss' | 'take-profit' | 'time' | 'bankruptcy';
  ambiguous: boolean;
  candleRevision: string;
};

export function openPosition(
  terms: ProposalTerms,
  candle: Candle,
  capital: string,
  rules: ExecutionRules,
):
  | { kind: 'opened'; fill: OpenFill }
  | { kind: 'rejected'; reason: 'capital' | 'wrong-instrument' | 'invalid-levels' } {
  if (candle.instrument !== terms.instrument) return { kind: 'rejected', reason: 'wrong-instrument' };
  const amount = new D(terms.amount);
  const fee = amount.mul(rules.feeRate);
  if (amount.lte(0) || amount.plus(fee).gt(capital)) return { kind: 'rejected', reason: 'capital' };
  const direction = terms.side === 'LONG' ? 1 : -1;
  const reference = new D(candle.close);
  const fillPrice = reference.mul(new D(1).plus(new D(rules.slippageBps).div(10000).mul(direction)));
  const stop = reference.mul(new D(1).minus(new D(terms.stopPct).div(100).mul(direction)));
  const target = reference.mul(new D(1).plus(new D(terms.targetPct).div(100).mul(direction)));
  if (
    direction > 0
      ? stop.gte(fillPrice) || target.lte(fillPrice)
      : stop.lte(fillPrice) || target.gte(fillPrice)
  ) {
    return { kind: 'rejected', reason: 'invalid-levels' };
  }
  return {
    kind: 'opened',
    fill: {
      at: candle.openAt + MINUTE,
      referencePrice: candle.close,
      price: price(fillPrice),
      amount: usd(amount),
      quantity: amount.div(fillPrice).toFixed(18),
      fee: usd(fee),
      stop: price(stop),
      target: price(target),
      candleRevision: candle.revision,
      rules,
    },
  };
}

export function closePosition(
  terms: ProposalTerms,
  entry: OpenFill,
  slots: readonly CandleSlot[],
  capital: string,
):
  | { kind: 'open'; mark: string; asOf: number; unrealized: string }
  | { kind: 'unresolved'; openAt: number }
  | { kind: 'closed'; fill: CloseFill } {
  const direction = terms.side === 'LONG' ? 1 : -1;
  const quantity = new D(entry.quantity);
  const expiry = entry.at + terms.horizon * MINUTE;
  const sorted = [...slots].sort(
    (a, b) =>
      (a.kind === 'closed' ? a.candle.openAt : a.openAt) - (b.kind === 'closed' ? b.candle.openAt : b.openAt),
  );
  let expectedAt = entry.at;
  let mark = entry.referencePrice;
  let asOf = entry.at;
  const close = (
    reference: string,
    at: number,
    reason: CloseFill['reason'],
    candle: Candle,
    ambiguous = false,
  ): CloseFill => {
    const exitPrice = new D(reference).mul(
      new D(1).minus(new D(entry.rules.slippageBps).div(10000).mul(direction)),
    );
    const fee = quantity.mul(exitPrice).mul(entry.rules.feeRate);
    return {
      at,
      referencePrice: reference,
      price: price(exitPrice),
      fee: usd(fee),
      pnl: usd(exitPrice.minus(entry.price).mul(quantity).mul(direction).minus(entry.fee).minus(fee)),
      reason,
      ambiguous,
      candleRevision: candle.revision,
    };
  };
  for (const slot of sorted) {
    const at = slot.kind === 'closed' ? slot.candle.openAt : slot.openAt;
    if (at < expectedAt) continue;
    if (at > expectedAt || slot.kind !== 'closed') return { kind: 'unresolved', openAt: expectedAt };
    const candle = slot.candle;
    if (candle.instrument !== terms.instrument) return { kind: 'unresolved', openAt: expectedAt };
    const stopAtOpen =
      direction > 0 ? new D(candle.open).lte(entry.stop) : new D(candle.open).gte(entry.stop);
    const targetAtOpen =
      direction > 0 ? new D(candle.open).gte(entry.target) : new D(candle.open).lte(entry.target);
    const stopHit = direction > 0 ? new D(candle.low).lte(entry.stop) : new D(candle.high).gte(entry.stop);
    const targetHit =
      direction > 0 ? new D(candle.high).gte(entry.target) : new D(candle.low).lte(entry.target);
    // Bankruptcy is evaluated at the first observable open and then close; never infer an intrabar path.
    const equityAtOpen = new D(capital)
      .minus(entry.fee)
      .plus(new D(candle.open).minus(entry.price).mul(quantity).mul(direction));
    if (equityAtOpen.lte(0)) return { kind: 'closed', fill: close(candle.open, at, 'bankruptcy', candle) };
    if (stopAtOpen) return { kind: 'closed', fill: close(candle.open, at, 'stop-loss', candle) };
    if (targetAtOpen) return { kind: 'closed', fill: close(entry.target, at, 'take-profit', candle) };
    if (stopHit)
      return { kind: 'closed', fill: close(entry.stop, at + MINUTE, 'stop-loss', candle, targetHit) };
    if (targetHit) return { kind: 'closed', fill: close(entry.target, at + MINUTE, 'take-profit', candle) };
    mark = candle.close;
    asOf = at + MINUTE;
    const equityAtClose = new D(capital)
      .minus(entry.fee)
      .plus(new D(mark).minus(entry.price).mul(quantity).mul(direction));
    if (equityAtClose.lte(0)) return { kind: 'closed', fill: close(mark, asOf, 'bankruptcy', candle) };
    if (asOf >= expiry) return { kind: 'closed', fill: close(mark, expiry, 'time', candle) };
    expectedAt += MINUTE;
  }
  return {
    kind: 'open',
    mark,
    asOf,
    unrealized: usd(new D(mark).minus(entry.price).mul(quantity).mul(direction).minus(entry.fee)),
  };
}
