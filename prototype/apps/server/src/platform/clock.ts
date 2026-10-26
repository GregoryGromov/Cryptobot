import { type Clock, instant } from '../kernel/time.js';
export const systemClock: Clock = { now: () => instant(Date.now()) };
export function replayClock(start: number): Clock & { advance(ms: number): void; set(at: number): void } {
  let current = instant(start);
  return {
    now: () => current,
    advance: (ms) => {
      current = instant(current + ms);
    },
    set: (at) => {
      current = instant(at);
    },
  };
}
