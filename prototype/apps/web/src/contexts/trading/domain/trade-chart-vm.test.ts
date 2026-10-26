import type { Candle } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { closedTrade, openTrade, pendingTrade, T0 } from '../testing/fixtures';
import { tradeChartVm } from './trade-chart-vm';

const candle = (minute: number, low: number, high: number): Candle => ({
  t: T0 + minute * 60_000,
  o: low,
  h: high,
  l: low,
  c: high,
  v: 1,
});

describe('tradeChartVm', () => {
  it('has nothing to draw without candles', () => {
    expect(tradeChartVm(openTrade(), [])).toEqual({ kind: 'empty' });
  });

  it('draws the entry, the stop and the target of an entered trade', () => {
    const vm = tradeChartVm(openTrade(), [candle(0, 1990, 2010), candle(1, 1995, 2030)]);
    expect(vm.kind === 'candles' ? vm.levels.map((l) => [l.kind, l.pinned]) : []).toEqual([
      ['take', null],
      ['entry', null],
      ['stop', null],
    ]);
  });

  it('pins a far target to the edge instead of flattening the candles', () => {
    const vm = tradeChartVm(openTrade({ takePrice: 2400 }), [candle(0, 1999, 2001), candle(1, 2000, 2002)]);
    expect(vm.kind === 'candles' ? vm.levels.find((l) => l.kind === 'take')?.pinned : null).toBe('above');
  });

  it('marks the entry and the exit of a closed trade', () => {
    const vm = tradeChartVm(closedTrade(), [candle(0, 1990, 2041)]);
    expect(vm.kind === 'candles' ? vm.markers.map((m) => m.kind) : []).toEqual(['entry', 'exit']);
  });

  it('draws no levels for an order not yet filled', () => {
    const vm = tradeChartVm(pendingTrade(), [candle(0, 1990, 2010)]);
    expect(vm.kind === 'candles' ? vm.levels : null).toEqual([]);
  });
});
