import { describe, expect, it } from 'vitest';
import {
  axisLabelAnchor,
  axisLabelIndices,
  clampPlotX,
  isTap,
  type PlotFrame,
  plotScale,
  plotStep,
} from './geometry.js';

const frame: PlotFrame = { width: 300, padLeft: 48, padRight: 12 };
const wideFrame: PlotFrame = { width: 600, padLeft: 48, padRight: 12 };

describe('plotStep', () => {
  it('spreads a point series over the gaps between points', () => {
    expect(plotStep({ frame, windowSize: 5, mode: 'point' })).toBe(60);
  });

  it('spreads a band series over one slot per point', () => {
    expect(plotStep({ frame, windowSize: 5, mode: 'band' })).toBe(48);
  });

  it('keeps a single-point window on the full plot span', () => {
    expect(plotStep({ frame, windowSize: 1, mode: 'point' })).toBe(240);
  });
});

describe('plotScale', () => {
  it('anchors the first point on the left padding', () => {
    expect(plotScale({ frame, windowSize: 5, phase: 0, mode: 'point' }).x(0)).toBe(48);
  });

  it('shifts a point series left by the sub-point pan phase', () => {
    expect(plotScale({ frame, windowSize: 5, phase: 0.5, mode: 'point' }).x(0)).toBe(18);
  });

  it('centres a band inside its own slot', () => {
    expect(plotScale({ frame, windowSize: 5, phase: 0, mode: 'band' }).x(0)).toBe(72);
  });
});

describe('clampPlotX', () => {
  it('holds a pointer left of the plot at the left padding', () => {
    expect(clampPlotX(frame, 10)).toBe(48);
  });

  it('holds a pointer right of the plot at the right padding', () => {
    expect(clampPlotX(frame, 999)).toBe(288);
  });

  it('passes a pointer inside the plot through', () => {
    expect(clampPlotX(frame, 120)).toBe(120);
  });
});

describe('axisLabelAnchor', () => {
  it('anchors a label at the left edge to its start', () => {
    expect(axisLabelAnchor(frame, 50)).toBe('start');
  });

  it('anchors a label at the right edge to its end', () => {
    expect(axisLabelAnchor(frame, 286)).toBe('end');
  });

  it('centres a label inside the plot', () => {
    expect(axisLabelAnchor(frame, 150)).toBe('middle');
  });
});

describe('axisLabelIndices', () => {
  it('spreads five labels across a wide frame', () => {
    expect(
      axisLabelIndices({
        frame: wideFrame,
        visibleCount: 10,
        windowSize: 10,
        phase: 0,
        mode: 'point',
      }),
    ).toEqual([0, 2, 5, 7, 9]);
  });

  it('thins to three labels on a narrow frame', () => {
    expect(axisLabelIndices({ frame, visibleCount: 10, windowSize: 10, phase: 0, mode: 'point' })).toEqual([
      0, 5, 9,
    ]);
  });

  it('skips the half-scrolled band on the leading edge', () => {
    expect(
      axisLabelIndices({
        frame: wideFrame,
        visibleCount: 5,
        windowSize: 4,
        phase: 0.6,
        mode: 'band',
      }),
    ).toEqual([1, 2, 3, 4]);
  });

  it('labels nothing when the window projects no points', () => {
    expect(
      axisLabelIndices({
        frame: wideFrame,
        visibleCount: 0,
        windowSize: 0,
        phase: 0,
        mode: 'band',
      }),
    ).toEqual([]);
  });
});

describe('isTap', () => {
  it('accepts a press that barely travelled', () => {
    expect(isTap({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(true);
  });

  it('rejects a press that travelled the threshold', () => {
    expect(isTap({ x: 0, y: 0 }, { x: 8, y: 0 })).toBe(false);
  });

  it('rejects a diagonal scroll gesture', () => {
    expect(isTap({ x: 10, y: 10 }, { x: 16, y: 16 })).toBe(false);
  });
});
