import type { AnalysisProgress } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { analysisOf, heldAfter } from './analysis';

const progress = (id: string, stage: AnalysisProgress['stage']): AnalysisProgress => ({
  id,
  stage,
  odds: [],
  plan: null,
  headline: null,
  thesis: null,
});

describe('an analysis as it is written', () => {
  it('shows what the server tells', () => {
    const held = heldAfter([], [progress('d1', 'odds')], 7);
    expect(analysisOf(held, 'd1', 7)).toMatchObject(progress('d1', 'odds'));
    expect(analysisOf(held, 'd2', 7)).toBeNull();
  });

  it('holds the last step once the server stops telling, until the conversation is read past it', () => {
    const held = heldAfter(heldAfter([], [progress('d1', 'reasons')], 7), [], 7);
    expect([analysisOf(held, 'd1', 7)?.stage, analysisOf(held, 'd1', 8)]).toEqual(['reasons', null]);
  });

  it('forgets a held analysis once the conversation has been read past it', () => {
    const held = heldAfter([], [progress('d1', 'reasons')], 7);
    expect(heldAfter(heldAfter(held, [], 7), [], 9)).toEqual([]);
  });

  it('starts over when the server tells it anew, as a retried run does', () => {
    const stopped = heldAfter(heldAfter([], [progress('d1', 'plan')], 7), [], 7);
    expect(analysisOf(heldAfter(stopped, [progress('d1', 'reading')], 8), 'd1', 8)?.stage).toBe('reading');
  });
});
