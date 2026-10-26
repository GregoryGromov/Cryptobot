import type { Chat, Horizon, Side } from '@reinforce/server/dto';
import { tradePreview } from '@reinforce/server/dto';
import type { AppRouter } from '@reinforce/server/router';
import type { inferRouterInputs } from '@trpc/server';
import { match } from 'ts-pattern';
import type { Locale } from '~/shared/i18n';
import { type ParsedDecimal, parseAmount, parsePercent } from './parse-amount';

export type TicketLimits = NonNullable<Chat['ticket']>;
export type TradeTerms = inferRouterInputs<AppRouter>['trading']['manual']['terms'];
export type TradePreview = ReturnType<typeof tradePreview>;

export type TicketDraft = {
  readonly side: Side;
  readonly amount: string;
  readonly stop: string;
  readonly take: string;
  readonly horizon: Horizon;
};

export type FieldProblem =
  | { readonly kind: 'empty' }
  | { readonly kind: 'format' }
  | { readonly kind: 'precision' }
  | { readonly kind: 'range'; readonly min: number; readonly max: number }
  | { readonly kind: 'slippage'; readonly min: number };

export type FieldCheck =
  | { readonly kind: 'ok'; readonly decimal: string; readonly value: number }
  | { readonly kind: 'problem'; readonly problem: FieldProblem };

type TicketOrder =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'unpriced' }
  | { readonly kind: 'ready'; readonly terms: TradeTerms; readonly preview: TradePreview };

export type TicketReview =
  | { readonly kind: 'blocked'; readonly reason: 'account-busy' | 'capital' }
  | {
      readonly kind: 'editing';
      readonly amount: FieldCheck;
      readonly stop: FieldCheck;
      readonly take: FieldCheck;
      readonly order: TicketOrder;
    };

const USUAL_AMOUNT = 500;
const USUAL_HORIZON: Horizon = 15;

export const initialDraft = (limits: TicketLimits): TicketDraft => ({
  side: 'LONG',
  amount: String(Math.max(limits.minUsd, Math.min(USUAL_AMOUNT, Math.floor(limits.maxUsd)))),
  stop: '1',
  take: '2',
  horizon: limits.horizons.includes(USUAL_HORIZON) ? USUAL_HORIZON : (limits.horizons[0] ?? USUAL_HORIZON),
});

export const horizonOf = (
  draft: Pick<TicketDraft, 'horizon'>,
  limits: Pick<TicketLimits, 'horizons'>,
): Horizon =>
  limits.horizons.includes(draft.horizon) ? draft.horizon : (limits.horizons[0] ?? draft.horizon);

const within = (parsed: ParsedDecimal, bounds: { readonly min: number; readonly max: number }): FieldCheck =>
  match(parsed)
    .with({ kind: 'error' }, ({ problem }): FieldCheck => ({ kind: 'problem', problem: { kind: problem } }))
    .with(
      { kind: 'ok' },
      (ok): FieldCheck =>
        ok.value < bounds.min || ok.value > bounds.max
          ? { kind: 'problem', problem: { kind: 'range', min: bounds.min, max: bounds.max } }
          : ok,
    )
    .exhaustive();

const beyondSlippage = (check: FieldCheck, slippageBps: number): FieldCheck => {
  const min = slippageBps / 100;
  if (check.kind === 'ok' && check.value <= min)
    return { kind: 'problem', problem: { kind: 'slippage', min } };
  return check;
};

export const reviewTicket = (input: {
  readonly draft: TicketDraft;
  readonly limits: TicketLimits;
  readonly instrument: string;
  readonly price: number | null;
  readonly locale: Locale;
}): TicketReview => {
  const { draft, limits, locale } = input;
  if (limits.blockedReason !== null) return { kind: 'blocked', reason: limits.blockedReason };
  const amount = within(parseAmount(draft.amount, locale), { min: limits.minUsd, max: limits.maxUsd });
  const stop = within(parsePercent(draft.stop, locale), limits.stopLossPct);
  const take = beyondSlippage(
    within(parsePercent(draft.take, locale), limits.takeProfitPct),
    limits.slippageBps,
  );
  if (amount.kind !== 'ok' || stop.kind !== 'ok' || take.kind !== 'ok')
    return { kind: 'editing', amount, stop, take, order: { kind: 'incomplete' } };
  if (input.price === null) return { kind: 'editing', amount, stop, take, order: { kind: 'unpriced' } };
  const terms: TradeTerms = {
    instrument: input.instrument,
    side: draft.side,
    amount: amount.decimal,
    stopPct: stop.value,
    targetPct: take.value,
    horizon: horizonOf(draft, limits),
  };
  const preview = tradePreview(terms, input.price, limits);
  return { kind: 'editing', amount, stop, take, order: { kind: 'ready', terms, preview } };
};

export type RequestIntent = { readonly key: string; readonly id: string };

const intentKey = (terms: TradeTerms): string =>
  [terms.instrument, terms.side, terms.amount, terms.stopPct, terms.targetPct, terms.horizon].join('|');

export const requestIntent = (
  previous: RequestIntent | null,
  terms: TradeTerms,
  mint: () => string,
): RequestIntent => {
  const key = intentKey(terms);
  return previous?.key === key ? previous : { key, id: mint() };
};
