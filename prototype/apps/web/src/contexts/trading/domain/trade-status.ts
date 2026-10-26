import type { TradeRow } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';

type ExitReason = Extract<TradeRow, { status: 'closed' }>['exit']['reason'];
type RejectReason = Extract<TradeRow, { status: 'rejected' }>['reason'];

export type StatusWords = {
  readonly t: TFunction<'trading'>;
  readonly clock: (at: number) => string;
};

const exitReasonText = (t: TFunction<'trading'>, reason: ExitReason): string =>
  match(reason)
    .with('stop-loss', () => t('exit.stop-loss'))
    .with('take-profit', () => t('exit.take-profit'))
    .with('time', () => t('exit.time'))
    .with('data-gap', () => t('exit.data-gap'))
    .with('bankruptcy', () => t('exit.bankruptcy'))
    .exhaustive();

const rejectReasonText = (t: TFunction<'trading'>, reason: RejectReason): string =>
  match(reason)
    .with('capital', () => t('reject.capital'))
    .with('wrong-instrument', () => t('reject.wrong-instrument'))
    .with('invalid-levels', () => t('reject.invalid-levels'))
    .exhaustive();

const closedText = ({ t, clock }: StatusWords, row: Extract<TradeRow, { status: 'closed' }>): string => {
  const status = t('status.closed', {
    reason: exitReasonText(t, row.exit.reason),
    time: clock(row.exit.at),
  });
  return row.ambiguous ? t('status.ambiguous', { status }) : status;
};

export const tradeStatusText = (words: StatusWords, row: TradeRow): string => {
  const { t, clock } = words;
  return match(row)
    .with({ status: 'pending', waitingFor: 'time' }, (r) => t('status.entryAt', { time: clock(r.entryAt) }))
    .with({ status: 'pending', waitingFor: 'prices' }, () => t('status.entryPrice'))
    .with({ status: 'pending', waitingFor: 'execution' }, () => t('status.execution'))
    .with({ status: 'rejected' }, (r) => t('status.rejected', { reason: rejectReasonText(t, r.reason) }))
    .with({ status: 'open', valuation: 'priced' }, (r) =>
      r.markAt === null ? t('status.noPrice') : t('status.priceAt', { time: clock(r.markAt) }),
    )
    .with({ status: 'open', valuation: 'awaiting-prices' }, () => t('status.prices'))
    .with({ status: 'open', valuation: 'awaiting-settlement' }, () => t('status.settlement'))
    .with({ status: 'closed' }, (r) => closedText(words, r))
    .exhaustive();
};

export type TradeResult =
  | { readonly kind: 'none' }
  | { readonly kind: 'unvalued' }
  | { readonly kind: 'pnl'; readonly pnl: number };

export const tradeResult = (row: TradeRow): TradeResult =>
  match(row)
    .with({ status: 'pending' }, { status: 'rejected' }, (): TradeResult => ({ kind: 'none' }))
    .with(
      { status: 'open' },
      (r): TradeResult => (r.unrealized === null ? { kind: 'unvalued' } : { kind: 'pnl', pnl: r.unrealized }),
    )
    .with({ status: 'closed' }, (r): TradeResult => ({ kind: 'pnl', pnl: r.pnl }))
    .exhaustive();

export const tradeAmount = (row: TradeRow): number | null =>
  match(row)
    .with({ status: 'pending' }, { status: 'rejected' }, (r) => r.requested)
    .with({ status: 'open' }, { status: 'closed' }, (r) => r.notional)
    .exhaustive();
