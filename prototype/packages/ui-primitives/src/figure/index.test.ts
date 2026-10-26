import { describe, expect, it } from 'vitest';
import { splitFigure } from './index.js';

describe('splitFigure', () => {
  it('splits cents with their separator off an English amount', () => {
    expect(splitFigure('$4,829,640.00', 'en-US')).toEqual({
      whole: '$4,829,640',
      fraction: '.00',
      tail: '',
    });
  });

  it('keeps a trailing currency sign out of the fraction in Russian', () => {
    expect(splitFigure('4 829 640,00 $', 'ru')).toEqual({
      whole: '4 829 640',
      fraction: ',00',
      tail: ' $',
    });
  });

  it('splits Arabic-Indic digits at the Arabic decimal separator', () => {
    const text = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(1750.5);
    const parts = splitFigure(text, 'ar-EG');
    expect(parts.fraction).toBe('٫٥٠');
    expect(parts.whole + parts.fraction + parts.tail).toBe(text);
  });

  it('splits Bengali digits at the period', () => {
    expect(splitFigure('১,৭৫০.৫০', 'bn')).toEqual({ whole: '১,৭৫০', fraction: '.৫০', tail: '' });
  });

  it('leaves a whole number unsplit', () => {
    expect(splitFigure('1,284', 'en-US')).toEqual({ whole: '1,284', fraction: '', tail: '' });
  });
});
