import type { TradeRow } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { toCents } from './equity';

export const returnOnAmount = (pnl: number, amount: number): number | null => {
  const base = toCents(amount);
  return base === 0 ? null : (toCents(pnl) / base) * 100;
};

export type TradeClose =
  | { readonly kind: 'due'; readonly at: number; readonly left: number }
  | { readonly kind: 'waiting' };

const WAITING: TradeClose = { kind: 'waiting' };

export const tradeClose = (row: TradeRow, now: number): TradeClose =>
  match(row)
    .with({ status: 'open' }, (r) =>
      r.exitDeadline > now
        ? { kind: 'due' as const, at: r.exitDeadline, left: r.exitDeadline - now }
        : WAITING,
    )
    .with({ status: 'pending' }, { status: 'rejected' }, { status: 'closed' }, () => WAITING)
    .exhaustive();

const HISTORY_PAGE = 8;

export const firstPage = <T>(rows: readonly T[], all: boolean): readonly T[] =>
  all ? rows : rows.slice(0, HISTORY_PAGE);
