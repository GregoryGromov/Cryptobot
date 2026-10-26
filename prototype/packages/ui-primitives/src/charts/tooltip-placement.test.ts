import { describe, expect, it } from 'vitest';
import type { ChartBoxSize } from './geometry.js';
import { placeTooltip } from './tooltip-placement.js';

const frame: ChartBoxSize = { width: 600, height: 280 };
const size: ChartBoxSize = { width: 160, height: 90 };

describe('placeTooltip', () => {
  it('sits to the right of the crosshair while it fits', () => {
    expect(placeTooltip({ frame, size, position: 100, avoidY: null })).toEqual({
      left: 112,
      top: 8,
    });
  });

  it('flips to the left of the crosshair near the right edge', () => {
    expect(placeTooltip({ frame, size, position: 500, avoidY: null }).left).toBe(328);
  });

  it('stays inside the frame when neither side fits', () => {
    expect(placeTooltip({ frame: { width: 200, height: 280 }, size, position: 100, avoidY: null }).left).toBe(
      8,
    );
  });

  it('drops to the bottom when the highlighted point shares the top corner', () => {
    expect(placeTooltip({ frame, size, position: 100, avoidY: 50 }).top).toBe(182);
  });

  it('keeps the top corner when the highlighted point sits low', () => {
    expect(placeTooltip({ frame, size, position: 100, avoidY: 200 }).top).toBe(8);
  });

  it('stays inside a frame shorter than the tooltip', () => {
    expect(placeTooltip({ frame: { width: 600, height: 60 }, size, position: 100, avoidY: 10 }).top).toBe(8);
  });
});
