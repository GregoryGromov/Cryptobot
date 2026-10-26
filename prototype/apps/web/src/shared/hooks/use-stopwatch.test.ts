import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStopwatch } from './use-stopwatch';

const START = Date.UTC(2026, 9, 15, 17, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useStopwatch', () => {
  it('counts whole seconds from the start on the screen’s own clock', () => {
    const { result } = renderHook(() => useStopwatch(START - 4_300, START - 4_300 + 4_300));
    expect(result.current).toBe(4);

    act(() => vi.advanceTimersByTime(700));
    expect(result.current).toBe(5);

    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current).toBe(8);
  });

  it('keeps counting on when the estimate of the server’s clock moves back', () => {
    const { result, rerender } = renderHook(({ serverNow }) => useStopwatch(START - 10_000, serverNow), {
      initialProps: { serverNow: START },
    });
    act(() => vi.advanceTimersByTime(2_000));
    rerender({ serverNow: START + 600 });

    expect(result.current).toBe(12);
  });

  it('never steps back when the wait comes to be timed from later', () => {
    const { result, rerender } = renderHook(({ since }) => useStopwatch(since, START), {
      initialProps: { since: START - 9_000 },
    });
    rerender({ since: START - 3_000 });

    expect(result.current).toBe(9);
  });
});
