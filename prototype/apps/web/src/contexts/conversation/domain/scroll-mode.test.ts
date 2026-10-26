import { describe, expect, it } from 'vitest';
import { followStep, glideMs, nextScrollMode, passedFloor, roomFor } from './scroll-mode';

describe('nextScrollMode', () => {
  it('opens following the end when nothing stands below the opening line', () => {
    expect(nextScrollMode('free', { type: 'opened', atEnd: true })).toBe('end');
  });

  it('opens left alone when the opening line has more below it', () => {
    expect(nextScrollMode('end', { type: 'opened', atEnd: false })).toBe('free');
  });

  it('turns when the reader speaks, wherever the page stood', () => {
    expect(nextScrollMode('free', { type: 'spoke' })).toBe('turn');
  });

  it('lets the reader have the page once they scroll away from the end', () => {
    expect(nextScrollMode('turn', { type: 'moved', atEnd: false })).toBe('free');
  });

  it('follows again once the reader scrolls back to the end', () => {
    expect(nextScrollMode('free', { type: 'moved', atEnd: true })).toBe('end');
  });

  it('keeps a turn while the reader stays at its end', () => {
    expect(nextScrollMode('turn', { type: 'moved', atEnd: true })).toBe('turn');
  });

  it('keeps a turn when the reader jumps to the end', () => {
    expect(nextScrollMode('turn', { type: 'jumped' })).toBe('turn');
  });

  it('follows the end after a jump from a free page', () => {
    expect(nextScrollMode('free', { type: 'jumped' })).toBe('end');
  });

  it('stops following while a forecast is read in full', () => {
    expect(nextScrollMode('end', { type: 'held' })).toBe('free');
  });

  it('leaves a turn alone when a forecast is opened under it', () => {
    expect(nextScrollMode('turn', { type: 'held' })).toBe('turn');
  });

  it('hands the page to the reader after a reveal', () => {
    expect(nextScrollMode('end', { type: 'revealed' })).toBe('free');
  });
});

describe('followStep', () => {
  it('stays where the reader left a free page', () => {
    expect(followStep('free', { top: 100, max: 900, arrived: null, spare: 144 })).toEqual({ kind: 'stay' });
  });

  it('jumps a line or two to the end', () => {
    expect(followStep('end', { top: 860, max: 900, arrived: null, spare: 144 })).toEqual({
      kind: 'jump',
      top: 900,
    });
  });

  it('glides to a card that came in', () => {
    expect(followStep('end', { top: 400, max: 900, arrived: null, spare: 144 })).toEqual({
      kind: 'glide',
      top: 900,
    });
  });

  it('never goes past the start of what came', () => {
    expect(followStep('end', { top: 400, max: 900, arrived: 620, spare: 144 })).toEqual({
      kind: 'glide',
      top: 620,
    });
  });

  it('stays when the page already stands at its target', () => {
    expect(followStep('end', { top: 900, max: 900, arrived: null, spare: 144 })).toEqual({ kind: 'stay' });
  });

  it('leaves a reader inside what came where they are when much more comes below', () => {
    expect(followStep('end', { top: 700, max: 1100, arrived: 620, spare: 144 })).toEqual({ kind: 'stay' });
  });

  it('never pulls a reader back up to the start of what came', () => {
    expect(followStep('end', { top: 700, max: 700, arrived: 620, spare: 144 })).toEqual({ kind: 'stay' });
  });

  it('gives a reader inside what came a line or two more', () => {
    expect(followStep('end', { top: 700, max: 740, arrived: 620, spare: 144 })).toEqual({
      kind: 'spare',
      top: 740,
    });
  });

  it('gives no more once the lines it may give are spent', () => {
    expect(followStep('end', { top: 700, max: 740, arrived: 620, spare: 20 })).toEqual({ kind: 'stay' });
  });
});

describe('roomFor', () => {
  it('grows the column so what was said can stand at the top', () => {
    expect(roomFor({ saidTop: 1200, viewport: 800, scrollHeight: 1500, column: 1400 })).toEqual({
      need: 500,
      height: 1900,
    });
  });

  it('asks for no room when the page is already long enough', () => {
    expect(roomFor({ saidTop: 200, viewport: 800, scrollHeight: 1500, column: 1400 })).toEqual({
      need: -500,
      height: 900,
    });
  });
});

describe('passedFloor', () => {
  it('counts an entry as seen once it rose above the field', () => {
    expect(passedFloor(500, 600)).toBe(true);
  });

  it('counts an entry under the field as still below', () => {
    expect(passedFloor(590, 600)).toBe(false);
  });
});

describe('glideMs', () => {
  it('glides short distances in at least 300 ms', () => {
    expect(glideMs(100)).toBe(300);
  });

  it('glides long distances in at most 560 ms', () => {
    expect(glideMs(-4000)).toBe(560);
  });
});
