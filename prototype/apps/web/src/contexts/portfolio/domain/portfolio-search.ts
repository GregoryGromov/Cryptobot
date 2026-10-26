import { match } from 'ts-pattern';
import * as z from 'zod/mini';
import type { BookKey } from './book-vm';
import { PERIODS } from './equity';

export const BOOKS = ['user'] as const satisfies readonly BookKey[];

export const TRADE_TABS = ['open', 'history', 'forecasts'] as const;

export type TradesTab = (typeof TRADE_TABS)[number];

export const portfolioSearch = z.object({
  book: z.catch(z.optional(z.enum(BOOKS)), undefined),
  userCycle: z.catch(z.optional(z.string()), undefined),
  agentCycle: z.catch(z.optional(z.string()), undefined),
  period: z.catch(z.optional(z.enum(PERIODS)), undefined),
  trade: z.catch(z.optional(z.string()), undefined),
  tab: z.catch(z.optional(z.enum(TRADE_TABS)), undefined),
});

export type PortfolioSearch = z.infer<typeof portfolioSearch>;

export const cycleOf = (search: PortfolioSearch, book: BookKey): string | undefined =>
  match(book)
    .with('user', () => search.userCycle)
    .with('agent', () => search.agentCycle)
    .exhaustive();

export const cycleSearch = (
  book: BookKey,
  cycle: string | undefined,
): Pick<PortfolioSearch, 'userCycle'> | Pick<PortfolioSearch, 'agentCycle'> =>
  match(book)
    .with('user', () => ({ userCycle: cycle }))
    .with('agent', () => ({ agentCycle: cycle }))
    .exhaustive();
