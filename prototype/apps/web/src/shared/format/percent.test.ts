import { describe, expect, it } from 'vitest';
import { directionOf, formatPercentChange } from './percent';

describe('percent change', () => {
  it('drops the sign of a change that rounds to zero', () => {
    expect(formatPercentChange(-0.04, 'en-US', 1)).toBe('0.0%');
  });

  it('signs a rise', () => {
    expect(formatPercentChange(1.234, 'en-US', 1)).toBe('+1.2%');
  });

  it('colours only a change that survives rounding', () => {
    expect(directionOf(-0.04, 1)).toBe('flat');
    expect(directionOf(-0.06, 1)).toBe('down');
    expect(directionOf(0.2, 1)).toBe('up');
  });
});
