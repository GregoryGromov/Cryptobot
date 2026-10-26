/** What an analysis's wait leaves for the forecast card that takes its place: its steps as last drawn, and its height. */
export type WaitHandoff = { readonly steps: HTMLElement; readonly height: number };

type Left = WaitHandoff & { readonly at: number };

const FRESH_MS = 3_000;

// A one-shot hand-over between the commit that removes the wait and the one that brings its card, not render state.
const left = new Map<string, Left>();

/** One analysis: its market and the moment it forecasts from, the same on its wait and on the forecast it brings. */
export const waitKey = (coin: string, t0: number): string => `${coin}@${t0}`;

/** The wait for `key` has ended: the card it brings may grow out of what it showed. */
export const leaveWait = (key: string, handoff: WaitHandoff): void => {
  left.set(key, { ...handoff, at: performance.now() });
};

/** What the wait for `key` left, if it ended a moment ago. */
export const waitLeft = (key: string): WaitHandoff | null => {
  const found = left.get(key);
  return found && performance.now() - found.at < FRESH_MS ? found : null;
};

/** The card has grown out of the wait for `key`; nothing else grows out of it. */
export const waitTaken = (key: string): void => {
  left.delete(key);
};
