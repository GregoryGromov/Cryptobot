import type { InputGroup } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { sectionsOf, tabOfRow, windowBar } from './inputs-vm';

const groups: InputGroup[] = [
  { id: 'move', rows: [{ kind: 'value', id: 'fresh', label: 'Свежесть', hint: '', text: '40%' }] },
  { id: 'indicators', rows: [{ kind: 'value', id: 'di', label: 'DI', hint: '', text: '24 против 12' }] },
];

describe('data sections', () => {
  it('lists the candles first, then each group with its rows and how many the reasons cite, then the answer', () => {
    expect(sectionsOf({ groups, cited: ['di'] })).toEqual([
      { id: 'candles', rows: null, cited: 0 },
      { id: 'move', rows: 1, cited: 0 },
      { id: 'indicators', rows: 1, cited: 1 },
      { id: 'answer', rows: null, cited: 0 },
    ]);
  });

  it('finds the section a cited row is in', () => {
    expect(tabOfRow({ groups }, 'di')).toBe('indicators');
  });

  it('finds no section for a row the data lacks', () => {
    expect(tabOfRow({ groups }, 'rsi')).toBeNull();
  });
});

describe('windowBar', () => {
  it('draws a ratio from the floor with the usual marked', () => {
    expect(windowBar('ratio', 2, [1, 2, 4])).toEqual({
      kind: 'ratio',
      y: 11,
      height: 11,
      usual: 16.5,
      hot: true,
    });
  });

  it('draws a share against a full column', () => {
    expect(windowBar('share', 50, [50])).toEqual({ kind: 'share', y: 11, height: 11 });
  });

  it('draws a fall below the zero line', () => {
    expect(windowBar('signed', -1, [-1, 0.5])).toEqual({ kind: 'signed', y: 11, height: 11, sign: 'down' });
  });

  it('draws a plain number without a direction', () => {
    expect(windowBar('plain', 2, [2, 1])).toMatchObject({ sign: 'none' });
  });
});
