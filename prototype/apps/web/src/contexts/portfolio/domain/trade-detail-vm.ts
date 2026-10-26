import type { TradeRow } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { fromCents, toCents } from './equity';

export const tradeFees = (row: TradeRow): number | null =>
  match(row)
    .with({ status: 'closed' }, (r) => fromCents(toCents(r.entry.fee) + toCents(r.exit.fee)))
    .with({ status: 'open' }, (r) => r.entry.fee)
    .with({ status: 'pending' }, { status: 'rejected' }, () => null)
    .exhaustive();
