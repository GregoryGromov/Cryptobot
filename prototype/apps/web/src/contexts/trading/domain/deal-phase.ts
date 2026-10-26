import type { ChatProposal, Estimate, TradeRow } from '@reinforce/server/dto';
import { match, P } from 'ts-pattern';

type Pending = Extract<TradeRow, { status: 'pending' }>;
type Rejected = Extract<TradeRow, { status: 'rejected' }>;
type Open = Extract<TradeRow, { status: 'open' }>;
type Closed = Extract<TradeRow, { status: 'closed' }>;

export type DealPhase =
  | { readonly kind: 'open'; readonly estimate: Estimate | null; readonly expiresAt: number }
  | { readonly kind: 'confirmed-pending'; readonly trade: Pending | null }
  | { readonly kind: 'entered'; readonly trade: Open }
  | { readonly kind: 'closed'; readonly trade: Closed }
  | { readonly kind: 'rejected'; readonly trade: Rejected }
  | { readonly kind: 'skipped' }
  | { readonly kind: 'expired'; readonly revisable: boolean }
  | { readonly kind: 'superseded' };

const tradePhase = (trade: TradeRow): DealPhase =>
  match(trade)
    .with({ status: 'pending' }, (t): DealPhase => ({ kind: 'confirmed-pending', trade: t }))
    .with({ status: 'open' }, (t): DealPhase => ({ kind: 'entered', trade: t }))
    .with({ status: 'closed' }, (t): DealPhase => ({ kind: 'closed', trade: t }))
    .with({ status: 'rejected' }, (t): DealPhase => ({ kind: 'rejected', trade: t }))
    .exhaustive();

const openPhase = (proposal: ChatProposal, now: number): DealPhase => {
  if (!proposal.latest) return { kind: 'superseded' };
  if (now >= proposal.expiresAt) return { kind: 'expired', revisable: true };
  return { kind: 'open', estimate: proposal.estimate, expiresAt: proposal.expiresAt };
};

export const dealPhase = (proposal: ChatProposal, now: number): DealPhase => {
  if (proposal.trade !== null) return tradePhase(proposal.trade);
  return match(proposal.status)
    .with('confirmed', (): DealPhase => ({ kind: 'confirmed-pending', trade: null }))
    .with('skipped', (): DealPhase => ({ kind: 'skipped' }))
    .with('expired', (): DealPhase => ({ kind: 'expired', revisable: proposal.latest }))
    .with('superseded', (): DealPhase => ({ kind: 'superseded' }))
    .with('open', () => openPhase(proposal, now))
    .exhaustive();
};

export type DealLevels = {
  readonly stop: number;
  readonly entry: number;
  readonly take: number;
  readonly now: number | null;
};

export const dealLevels = (phase: DealPhase): DealLevels | null =>
  match(phase)
    .with({ kind: 'open', estimate: P.nonNullable }, ({ estimate }) => ({
      stop: estimate.stopPrice,
      entry: estimate.entryPrice,
      take: estimate.takePrice,
      now: estimate.price,
    }))
    .with({ kind: 'entered' }, ({ trade }) => ({
      stop: trade.stopPrice,
      entry: trade.entry.price,
      take: trade.takePrice,
      now: trade.mark,
    }))
    .with({ kind: 'closed' }, ({ trade }) => ({
      stop: trade.stopPrice,
      entry: trade.entry.price,
      take: trade.takePrice,
      now: trade.exit.price,
    }))
    .with(
      { kind: 'open' },
      { kind: P.union('confirmed-pending', 'rejected', 'skipped', 'expired', 'superseded') },
      () => null,
    )
    .exhaustive();

export const scaleOffset = (levels: DealLevels, price: number): number => {
  const span = levels.take - levels.stop;
  if (span === 0) return 0.5;
  return Math.min(1, Math.max(0, (price - levels.stop) / span));
};

const pad = (n: number): string => String(n).padStart(2, '0');

export const countdown = (ms: number): string => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
};
