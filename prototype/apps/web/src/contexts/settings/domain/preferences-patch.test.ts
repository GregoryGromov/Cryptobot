import type { UiPreferences } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { applyPatch, revertPatch } from './preferences-patch';

const prefs: UiPreferences = {
  classes: [],
  markets: ['BTC'],
  maxTradeUsd: 1000,
  analysisLimit: 10,
  ideaLimit: 10,
  mode: 'daytrader',
  autoAnalysis: false,
  alerts: true,
  actionableOnly: true,
  quiet: { on: false, from: 23, to: 7, tz: 'Europe/Moscow' },
  style: '',
};

describe('a preferences patch', () => {
  it('shows a trade cap as the number the screen reads', () => {
    expect(applyPatch(prefs, { maxTradeUsd: '2500.50' }).maxTradeUsd).toBe(2500.5);
  });

  it('shows quiet hours in the shape the screen reads', () => {
    const quiet = { enabled: true, from: 22, to: 8, timezone: 'Asia/Tbilisi' };
    expect(applyPatch(prefs, { quiet }).quiet).toEqual({ on: true, from: 22, to: 8, tz: 'Asia/Tbilisi' });
  });

  it('changes how the person trades', () => {
    expect(applyPatch(prefs, { mode: 'scalper' }).mode).toBe('scalper');
  });

  it('leaves the fields it does not name as they were', () => {
    expect(applyPatch(prefs, { autoAnalysis: true })).toEqual({ ...prefs, autoAnalysis: true });
  });
});

describe('undoing a failed save', () => {
  it('restores the field the save changed', () => {
    const patch = { autoAnalysis: true };
    expect(revertPatch(applyPatch(prefs, patch), prefs, patch)).toEqual(prefs);
  });

  it('keeps a newer choice made while the failed save was waiting', () => {
    const failed = { ideaLimit: 12 };
    const newer = applyPatch(applyPatch(prefs, failed), { ideaLimit: 15, alerts: false });
    expect(revertPatch(newer, prefs, failed)).toEqual({ ...prefs, ideaLimit: 15, alerts: false });
  });

  it('keeps a newer save to another field', () => {
    const failed = { style: 'осторожно' };
    const newer = applyPatch(applyPatch(prefs, failed), { analysisLimit: 20 });
    expect(revertPatch(newer, prefs, failed)).toEqual({ ...prefs, analysisLimit: 20 });
  });
});
