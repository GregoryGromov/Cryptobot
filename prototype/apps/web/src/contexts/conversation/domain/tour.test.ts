import { describe, expect, it } from 'vitest';
import { DEMO_GAIN, DEMO_LOSS, priceAt, shortResult, TOUR_START, type TourState, tourReducer } from './tour';

const at = (index: number): TourState => ({ at: index, way: 1, run: index, leaving: false });

describe('tourReducer', () => {
  it('moves on to the next beat and restarts its clock', () => {
    expect(tourReducer(TOUR_START, { type: 'next' })).toEqual({ at: 1, way: 1, run: 1, leaving: false });
  });

  it('steps back one beat', () => {
    expect(tourReducer(at(3), { type: 'back' })).toEqual({ at: 2, way: -1, run: 4, leaving: false });
  });

  it('stays on the first beat on back', () => {
    expect(tourReducer(TOUR_START, { type: 'back' })).toBe(TOUR_START);
  });

  it('leaves after the last beat', () => {
    expect(tourReducer(at(5), { type: 'next' })).toEqual({ at: 5, way: 1, run: 5, leaving: true });
  });

  it('leaves at once on skip', () => {
    expect(tourReducer(at(2), { type: 'skip' }).leaving).toBe(true);
  });

  it('ignores the buttons once leaving', () => {
    const leaving = { ...at(2), leaving: true };
    expect(tourReducer(leaving, { type: 'back' })).toBe(leaving);
  });
});

describe('the made-up trade', () => {
  it('makes 17.80 dollars on a 2,000 dollar short from 67,400 to 66,800', () => {
    expect(DEMO_GAIN).toBeCloseTo(17.804, 3);
  });

  it('loses 8.90 dollars at the stop of 67,700', () => {
    expect(DEMO_LOSS).toBeCloseTo(8.902, 3);
  });

  it('counts a rise against a short as a loss', () => {
    expect(shortResult(1_000, 100, 101)).toBe(-10);
  });

  it('runs from the entry to the target', () => {
    expect([priceAt(0), priceAt(1)]).toEqual([67_400, 66_800]);
  });

  it('stands between two ten-second points halfway between them', () => {
    expect(priceAt(0.5 / 26)).toBe(67_416);
  });
});
