import { describe, expect, it } from 'vitest';
import { evaluationSkill } from './evaluations-vm';

describe('evaluationSkill', () => {
  it('is better when the error is clearly below the statistics', () => {
    expect(evaluationSkill(0.4, 0.56, 248, 30)).toBe('better');
  });

  it('is worse when the error is clearly above the statistics', () => {
    expect(evaluationSkill(0.7, 0.56, 248, 30)).toBe('worse');
  });

  it('is on par inside the margin', () => {
    expect(evaluationSkill(0.555, 0.56, 248, 30)).toBe('same');
  });

  it('says too little data below the observation floor', () => {
    expect(evaluationSkill(0.2, 0.56, 12, 30)).toBe('early');
  });

  it('says too little data without statistics', () => {
    expect(evaluationSkill(0.2, null, 248, 30)).toBe('early');
  });
});
