import { describe, expect, it } from 'vitest';
import { candle, forecastNote, horizonNote, T0 } from '../forecast-fixture';
import {
  invalidationCrossed,
  isLive,
  onTerm,
  pointTally,
  progressOf,
  spanMinutes,
  stripOf,
} from './episode-vm';
import { horizonDetail } from './horizon-vm';

const MINUTE = 60_000;

describe('onTerm', () => {
  it('keeps the one horizon the person trades', () => {
    expect(onTerm(forecastNote(), 30).horizons.map((h) => h.horizon)).toEqual([30]);
  });

  it('leaves a forecast without that horizon as it is', () => {
    const forecast = forecastNote({ horizons: [horizonNote(5), horizonNote(15)] });
    expect(onTerm(forecast, 30).horizons.map((h) => h.horizon)).toEqual([5, 15]);
  });

  it('spans as far as its last horizon', () => {
    expect([spanMinutes(forecastNote()), spanMinutes(onTerm(forecastNote(), 5))]).toEqual([60, 5]);
  });
});

describe('stripOf', () => {
  it('lays out the four horizons in order', () => {
    expect(stripOf(forecastNote(), T0).map((c) => c.horizon)).toEqual([5, 15, 30, 60]);
  });

  it('marks the horizon the trade is on', () => {
    expect(stripOf(forecastNote(), T0).map((c) => c.traded)).toEqual([false, true, false, false]);
  });

  it('waits for a check still ahead', () => {
    expect(stripOf(forecastNote(), T0)[0]?.status).toEqual({ kind: 'waiting', at: T0 + 5 * MINUTE });
  });

  it('is checking once the time has come without a result', () => {
    expect(stripOf(forecastNote(), T0 + 6 * MINUTE)[0]?.status).toEqual({
      kind: 'checking',
      at: T0 + 5 * MINUTE,
    });
  });

  it('reads a resolved horizon as a hit when it went as leaned', () => {
    const forecast = forecastNote({
      horizons: [horizonNote(5, { checkStatus: 'resolved', checked: { returnPct: 0.31, cls: 'UP' } })],
    });

    expect(stripOf(forecast, T0 + 6 * MINUTE)[0]?.status).toEqual({
      kind: 'checked',
      returnPct: 0.31,
      outcome: 'UP',
      mark: 'hit',
    });
  });

  it('keeps the top tenths for a tie', () => {
    const forecast = forecastNote({
      horizons: [horizonNote(5, { probs: { p_up: 0.4, p_flat: 0.2, p_down: 0.4 } })],
    });

    expect(stripOf(forecast, T0)[0]).toMatchObject({ lean: null, top: 4 });
  });

  it('says a horizon without prices as such', () => {
    const forecast = forecastNote({ horizons: [horizonNote(5, { checkStatus: 'unresolved-data-quality' })] });

    expect(stripOf(forecast, T0 + 6 * MINUTE)[0]?.status).toEqual({ kind: 'no-prices' });
  });
});

describe('progressOf', () => {
  it('names the next check ahead', () => {
    expect(progressOf(forecastNote(), T0 + 6 * MINUTE)).toEqual({ kind: 'next', at: T0 + 15 * MINUTE });
  });

  it('counts the hits once every horizon is checked', () => {
    const forecast = forecastNote({
      horizons: [
        horizonNote(5, { checkStatus: 'resolved', checked: { returnPct: 0.3, cls: 'UP' } }),
        horizonNote(15, { checkStatus: 'resolved', checked: { returnPct: -0.4, cls: 'DOWN' } }),
        horizonNote(30, { checkStatus: 'resolved', checked: { returnPct: 0.5, cls: 'UP' } }),
        horizonNote(60, { checkStatus: 'unresolved-data-quality' }),
      ],
    });

    expect(progressOf(forecast, T0 + 61 * MINUTE)).toEqual({ kind: 'done', hits: 2, n: 3 });
  });
});

describe('progressOf a single horizon', () => {
  const checked = (cls: 'UP' | 'DOWN') =>
    forecastNote({
      horizons: [horizonNote(30, { checkStatus: 'resolved', checked: { returnPct: 0.3, cls } })],
    });

  it('says it came true when the price went as leaned', () => {
    expect(progressOf(checked('UP'), T0 + 31 * MINUTE)).toEqual({ kind: 'hit' });
  });

  it('says it did not when the price went the other way', () => {
    expect(progressOf(checked('DOWN'), T0 + 31 * MINUTE)).toEqual({ kind: 'miss' });
  });
});

describe('pointTally', () => {
  it('counts the points for the leaned way, against it and the risks', () => {
    expect(pointTally(forecastNote())).toEqual({ kind: 'leaning', backing: 2, against: 1, risks: 1 });
  });

  it('counts plain points when the trade horizon has no lean', () => {
    const forecast = forecastNote({
      horizons: [horizonNote(15, { probs: { p_up: 0.4, p_flat: 0.2, p_down: 0.4 } })],
    });

    expect(pointTally(forecast)).toEqual({ kind: 'open', points: 3, risks: 1 });
  });
});

describe('liveness', () => {
  it('is live while a horizon waits', () => {
    expect(isLive(forecastNote())).toBe(true);
  });

  it('is settled once every horizon has an answer', () => {
    const forecast = forecastNote({
      horizons: [horizonNote(5, { checkStatus: 'resolved', checked: { returnPct: 0.3, cls: 'UP' } })],
    });

    expect(isLive(forecast)).toBe(false);
  });
});

describe('invalidationCrossed', () => {
  it('is crossed when the last close after the forecast is beyond the level', () => {
    expect(invalidationCrossed(forecastNote(), [candle(0, 99.5), candle(1, 99.1)], T0 + 3 * MINUTE)).toBe(
      true,
    );
  });

  it('is not crossed while the price stays on its side', () => {
    expect(invalidationCrossed(forecastNote(), [candle(0, 99.5), candle(1, 100.4)], T0 + 3 * MINUTE)).toBe(
      false,
    );
  });

  it('no longer counts after the forecast hour', () => {
    expect(invalidationCrossed(forecastNote(), [candle(1, 98)], T0 + 61 * MINUTE)).toBe(false);
  });

  it('no longer counts after the one horizon the person trades', () => {
    expect(invalidationCrossed(onTerm(forecastNote(), 5), [candle(1, 98)], T0 + 6 * MINUTE)).toBe(false);
  });
});

describe('horizonDetail', () => {
  it('prices the three outcomes around the flat band', () => {
    const detail = horizonDetail(forecastNote(), horizonNote(15, { tau: 0.2 }), T0);

    expect(detail.outcomes.map((o) => o.range)).toEqual([
      { kind: 'below', price: expect.closeTo(99.8) },
      { kind: 'between', lo: expect.closeTo(99.8), hi: expect.closeTo(100.2) },
      { kind: 'above', price: expect.closeTo(100.2) },
    ]);
  });

  it('marks where a checked price landed', () => {
    const detail = horizonDetail(
      forecastNote(),
      horizonNote(15, { checkStatus: 'resolved', checked: { returnPct: -0.3, cls: 'DOWN' } }),
      T0 + 16 * MINUTE,
    );

    expect(detail.outcomes.map((o) => o.landed)).toEqual([true, false, false]);
  });

  it('turns the quantiles into prices', () => {
    expect(horizonDetail(forecastNote(), horizonNote(15), T0).expected).toEqual({
      price: expect.closeTo(100.2),
      lo: expect.closeTo(99.7),
      hi: expect.closeTo(100.7),
    });
  });
});
