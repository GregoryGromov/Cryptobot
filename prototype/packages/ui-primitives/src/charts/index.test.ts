import { describe, expect, it } from 'vitest';
import {
  areaPath,
  chartTicks,
  DONUT,
  donutIds,
  donutPaths,
  fittedTicks,
  linearScale,
  linePath,
  nearestIndex,
  seriesColor,
  sparkAreaPath,
  sparkPath,
  valueExtent,
  withinDomain,
} from './index.js';

const NUM = '(-?[\\d.]+(?:e[+-]?\\d+)?)';

function pathStart(d: string): readonly [number, number] {
  const m = d.match(new RegExp(`^M${NUM},${NUM}`));
  if (!m) throw new Error(`no M start in ${d}`);
  return [Number(m[1]), Number(m[2])];
}

function firstArcEnd(d: string): readonly [number, number] {
  const m = d.match(new RegExp(`A${NUM},${NUM},${NUM},[01],[01],${NUM},${NUM}`));
  if (!m) throw new Error(`no arc in ${d}`);
  return [Number(m[4]), Number(m[5])];
}

function allCoordinates(d: string): readonly (readonly [number, number])[] {
  return [...d.matchAll(new RegExp(`[ML]${NUM},${NUM}`, 'g'))].map((m) => [Number(m[1]), Number(m[2])]);
}

const HALF_GAP_AT_RIM = 1.2 / DONUT.outer;

const shareAngle = (share: number): number => (share / 100) * Math.PI * 2;

const rimPoint = (angle: number): readonly [number, number] => [
  DONUT.outer * Math.sin(angle),
  -DONUT.outer * Math.cos(angle),
];

describe('donutPaths', () => {
  it('centres the gap between the last and first segment on twelve o’clock', () => {
    const [first, second] = donutPaths([1, 1]);

    const [startX, startY] = pathStart(first ?? '');
    const [endX] = firstArcEnd(second ?? '');
    expect(startX).toBeCloseTo(1.2, 4);
    expect(startY).toBeCloseTo(-DONUT.outer, 1);
    expect(endX).toBeCloseTo(-1.2, 4);
  });

  it('cuts a gap with parallel edges, as wide at the hole as at the rim', () => {
    const [first] = donutPaths([1, 1]);

    const [rimX] = firstArcEnd(first ?? '');
    const [holeX, holeY] = allCoordinates(first ?? '')[1] ?? [Number.NaN, Number.NaN];
    expect(rimX).toBeCloseTo(1.2, 4);
    expect(holeX).toBeCloseTo(1.2, 4);
    expect(holeY).toBeCloseTo(DONUT.inner, 1);
  });

  it('keeps segments in input order instead of d3’s size-descending default', () => {
    const [first] = donutPaths([10, 90]);

    const [ex, ey] = firstArcEnd(first ?? '');
    const [wantX, wantY] = rimPoint(shareAngle(10) - HALF_GAP_AT_RIM);
    expect(ex).toBeCloseTo(wantX, 3);
    expect(ey).toBeCloseTo(wantY, 3);
  });

  it.each([25, 50, 75])('sweeps a %i%% first segment up to the gap at its boundary', (share) => {
    const [first] = donutPaths([share, 100 - share]);

    const [ex, ey] = firstArcEnd(first ?? '');
    const [wantX, wantY] = rimPoint(shareAngle(share) - HALF_GAP_AT_RIM);
    expect(ex).toBeCloseTo(wantX, 3);
    expect(ey).toBeCloseTo(wantY, 3);
  });

  it('renders a single 100% share as a closed full annulus', () => {
    const paths = donutPaths([100]);

    expect(paths).toHaveLength(1);
    const d = paths[0] ?? '';
    expect(d).toContain(`A${DONUT.outer},${DONUT.outer}`);
    expect(d).toContain(`A${DONUT.inner},${DONUT.inner}`);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('gives a zero share a degenerate path without shifting its neighbours', () => {
    const paths = donutPaths([0, 50, 50]);

    expect(paths).toHaveLength(3);
    const [sx, sy] = pathStart(paths[1] ?? '');
    expect(sx).toBeCloseTo(1.2, 4);
    expect(sy).toBeCloseTo(-DONUT.outer, 1);
  });

  it('normalises shares that do not sum to 100', () => {
    const [first] = donutPaths([1, 3]);

    const [ex, ey] = firstArcEnd(first ?? '');
    const [wantX, wantY] = rimPoint(shareAngle(25) - HALF_GAP_AT_RIM);
    expect(ex).toBeCloseTo(wantX, 3);
    expect(ey).toBeCloseTo(wantY, 3);
  });
});

describe('donutIds', () => {
  it('derives instance-unique ids from the prefix so two donuts on one page never collide', () => {
    const a = donutIds('proof-donut');
    const b = donutIds('chain-donut');

    expect(a.segment(0)).not.toBe(b.segment(0));
    expect(a.rim).not.toBe(b.rim);
    expect(a.shadow).not.toBe(b.shadow);
  });

  it('keeps segment, rim and shadow ids distinct within one instance', () => {
    const ids = donutIds('proof-donut');

    const all = [ids.segment(0), ids.segment(1), ids.rim, ids.shadow];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('linearScale', () => {
  it('maps domain ends onto range ends including an inverted y-range', () => {
    const y = linearScale([0, 10], [100, 0]);

    expect(y(0)).toBe(100);
    expect(y(10)).toBe(0);
    expect(y(5)).toBe(50);
  });

  it('collapses a zero-span domain to the range midpoint', () => {
    const y = linearScale([5, 5], [100, 0]);

    expect(y(5)).toBe(50);
    expect(y(999)).toBe(50);
  });
});

describe('linePath', () => {
  it('draws index-positioned points through the scales', () => {
    const x = linearScale([0, 1], [0, 100]);
    const y = linearScale([0, 10], [100, 0]);

    expect(linePath([0, 10], x, y)).toBe('M0,100L100,0');
  });

  it('breaks into one subpath per defined run at null gaps', () => {
    const x = linearScale([0, 4], [0, 100]);
    const y = linearScale([0, 10], [100, 0]);

    const d = linePath([1, 2, null, 3, 4], x, y);
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it('skips leading and trailing nulls without phantom points', () => {
    const x = linearScale([0, 3], [0, 90]);
    const y = linearScale([0, 10], [100, 0]);

    const d = linePath([null, 0, 10, null], x, y);
    expect(d).toBe('M30,100L60,0');
  });
});

describe('areaPath', () => {
  it('closes the band down to the baseline', () => {
    const x = linearScale([0, 1], [0, 100]);
    const y = linearScale([0, 10], [100, 0]);

    expect(areaPath([0, 10], x, y, 100)).toBe('M0,100L100,0L100,100L0,100Z');
  });

  it('closes each defined run separately across null gaps', () => {
    const x = linearScale([0, 2], [0, 100]);
    const y = linearScale([0, 10], [100, 0]);

    const d = areaPath([1, null, 2], x, y, 100);
    expect(d.match(/Z/g)).toHaveLength(2);
  });
});

describe('sparkPath', () => {
  it('fits every point inside the padded frame', () => {
    const d = sparkPath([0, 5, 10, 2, 8], { width: 100, height: 32, pad: 2 });

    for (const [x, y] of allCoordinates(d)) {
      expect(x).toBeGreaterThanOrEqual(2);
      expect(x).toBeLessThanOrEqual(98);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(30);
    }
  });

  it('draws a constant series as a flat midline', () => {
    const d = sparkPath([3, 3, 3], { width: 100, height: 32, pad: 2 });

    for (const [, y] of allCoordinates(d)) {
      expect(y).toBe(16);
    }
  });
});

describe('sparkAreaPath', () => {
  it('closes the fill under the line down to the bottom of the frame', () => {
    const frame = { width: 100, height: 32, pad: 2 };
    const area = allCoordinates(sparkAreaPath([0, 5, 10], frame));
    const line = allCoordinates(sparkPath([0, 5, 10], frame));

    expect(area.some(([, y]) => y === frame.height)).toBe(true);
    for (const point of line) expect(area).toContainEqual(point);
  });
});

describe('valueExtent', () => {
  it('ignores null gaps', () => {
    expect(valueExtent([null, 3, 1, null, 7])).toEqual([1, 7]);
  });

  it('returns null for an all-null series', () => {
    expect(valueExtent([null, null])).toBeNull();
  });
});

describe('chartTicks', () => {
  it('nices the domain and returns round tick values', () => {
    const { domain, ticks } = chartTicks(0.13, 9.7, 5);

    expect(domain).toEqual([0, 10]);
    expect(ticks).toEqual([0, 2, 4, 6, 8, 10]);
  });
});

describe('fittedTicks', () => {
  it('opens a readable band around a series that barely moves', () => {
    const { domain, ticks } = fittedTicks({ lo: 100.97, hi: 101, count: 4, minSpan: 0.04 });

    expect(domain).toEqual([100.96, 101.01]);
    expect(ticks).toEqual([100.96, 100.97, 100.98, 100.99, 101, 101.01]);
  });

  it('gives a flat series the whole minimum span instead of a degenerate domain', () => {
    const { domain } = fittedTicks({ lo: 101, hi: 101, count: 4, minSpan: 0.04 });

    expect(domain).toEqual([100.98, 101.02]);
  });

  it('pads a series that already spans more than the minimum', () => {
    const { domain } = fittedTicks({ lo: 99.8, hi: 100.3, count: 4, minSpan: 0.04 });

    expect(domain).toEqual([99.6, 100.4]);
  });
});

describe('withinDomain', () => {
  it('reads a reference the fitted axis zoomed past as out of view', () => {
    expect(withinDomain([100.96, 101.01], 100)).toBe(false);
    expect(withinDomain([99.6, 100.4], 100)).toBe(true);
  });
});

describe('nearestIndex', () => {
  it('picks the closest position for crosshair lookup', () => {
    expect(nearestIndex([0, 10, 20], 12)).toBe(1);
    expect(nearestIndex([0, 10, 20], 16)).toBe(2);
  });
});

describe('seriesColor', () => {
  it('cycles the ordered chart vars past the palette length', () => {
    expect(seriesColor(0)).toBe('var(--chart-1)');
    expect(seriesColor(4)).toBe('var(--chart-5)');
    expect(seriesColor(5)).toBe('var(--chart-1)');
  });
});
