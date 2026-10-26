import type { AnalysisProgress } from '@reinforce/server/dto';

/** `stoppedAt`: the conversation's seq when the server stopped telling the analysis; null while it tells it. */
export type HeldAnalysis = AnalysisProgress & { readonly stoppedAt: number | null };

/**
 * The analyses after the server tells them again. One it no longer tells is held until the conversation is read past
 * that moment, with the forecast or the failure it ended in, so the wait never falls back to reading meanwhile.
 */
export const heldAfter = (
  held: readonly HeldAnalysis[],
  told: readonly AnalysisProgress[],
  seq: number,
): readonly HeldAnalysis[] => [
  ...told.map((progress) => ({ ...progress, stoppedAt: null })),
  ...held.flatMap((analysis) =>
    told.some((progress) => progress.id === analysis.id) ||
    (analysis.stoppedAt !== null && seq > analysis.stoppedAt)
      ? []
      : [{ ...analysis, stoppedAt: analysis.stoppedAt ?? seq }],
  ),
];

export const analysisOf = (
  held: readonly HeldAnalysis[],
  id: string,
  seq: number,
): AnalysisProgress | null => {
  const analysis = held.find((each) => each.id === id);
  return analysis && (analysis.stoppedAt === null || seq <= analysis.stoppedAt) ? analysis : null;
};
