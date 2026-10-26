import { describe, expect, it } from 'vitest';
import { corridor } from './corridor-vm';

describe('corridor', () => {
  it('lays the range from edge to edge with the forecast’s start and the expected move inside it', () => {
    const c = corridor({ q10: -0.3, expected: 0.3, q90: 0.94 });

    expect([c.lo, c.start, c.mid, c.hi].map((x) => Math.round(x * 10) / 10)).toEqual([4, 26.3, 48.5, 96]);
  });

  it('keeps the start on the line when the whole range lies above it', () => {
    const c = corridor({ q10: 0.2, expected: 0.5, q90: 1 });

    expect([c.start, c.lo, c.hi]).toEqual([4, expect.closeTo(22.4), 96]);
  });

  it('hangs the expected move’s words inward when it stands at an edge', () => {
    expect([
      corridor({ q10: -1, expected: -0.95, q90: 1 }).anchor,
      corridor({ q10: -1, expected: 0, q90: 1 }).anchor,
      corridor({ q10: -1, expected: 0.95, q90: 1 }).anchor,
    ]).toEqual(['start', 'middle', 'end']);
  });
});
