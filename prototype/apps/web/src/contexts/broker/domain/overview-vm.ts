import type { AgentView, Horizon } from '@reinforce/server/dto';

export const SCORE_FROM = 10;

export type Score =
  | { readonly kind: 'early'; readonly n: number }
  | { readonly kind: 'tenths'; readonly tenths: number; readonly n: number };

type Terms = AgentView['scorecard']['terms'];

export const scoreOf = (terms: Terms, horizon: Horizon): Score => {
  const term = terms.find((item) => item.horizon === horizon);
  const n = term?.n ?? 0;
  if (!term || n < SCORE_FROM) return { kind: 'early', n };
  return { kind: 'tenths', tenths: Math.round((term.hits / n) * 10), n };
};
