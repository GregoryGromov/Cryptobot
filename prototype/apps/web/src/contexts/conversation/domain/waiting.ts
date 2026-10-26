import type { Pending, WaitKind } from './chat-types';

// An answer usually comes within ten seconds; twice that is worth saying.
const SLOW_ANSWER_S = 20;
// A shorter wait needs no clock: counting from zero only makes it felt.
const CLOCK_AFTER_S = 5;

export type WaitView = {
  readonly kind: WaitKind;
  readonly retry: boolean;
  readonly deadline: number | null;
  /** Whole seconds waited, once the wait is long enough to be worth counting. */
  readonly clock: number | null;
  /** An answer taking much longer than answers do. */
  readonly slow: boolean;
};

/** The clock to show after so many seconds of waiting, if any. */
export const clockOf = (seconds: number): number | null =>
  seconds >= CLOCK_AFTER_S ? Math.floor(seconds) : null;

export const waitView = (run: Pending, now: number): WaitView => {
  const seconds = Math.max(0, (now - run.since) / 1000);
  return {
    kind: run.kind,
    retry: run.attempt > 1,
    deadline: run.deadline,
    clock: clockOf(seconds),
    slow: run.kind === 'converse' && seconds >= SLOW_ANSWER_S,
  };
};

export type WaitRow = { readonly key: string; readonly run: Pending };

export const waitRows = (runs: readonly Pending[], hidden: string | null): readonly WaitRow[] => {
  const rows: WaitRow[] = [];
  for (const run of runs) {
    if (run.id === hidden) continue;
    rows.push({ key: rows.length === 0 ? 'wait-lead' : `wait-${run.id}`, run });
  }
  return rows;
};
