import { describe, expect, it } from 'vitest';
import { checkAmount, checkCount, parseAmount } from './parse-amount';

describe('an amount typed in Russian', () => {
  it('reads space-grouped thousands', () => {
    expect(parseAmount('1 000', 'ru')).toEqual({ kind: 'amount', value: 1000, decimal: '1000' });
  });

  it('reads thousands grouped by the no-break space the page itself prints', () => {
    expect(parseAmount('1 000', 'ru')).toEqual({ kind: 'amount', value: 1000, decimal: '1000' });
  });

  it('reads a comma as the decimal mark', () => {
    expect(parseAmount('2,5', 'ru')).toEqual({ kind: 'amount', value: 2.5, decimal: '2.5' });
  });

  it('refuses a comma followed by three digits rather than guess at thousands', () => {
    expect(parseAmount('1,000', 'ru')).toEqual({ kind: 'invalid' });
  });
});

describe('an amount typed in English', () => {
  it('reads comma-grouped thousands with cents', () => {
    expect(parseAmount('1,000.50', 'en')).toEqual({ kind: 'amount', value: 1000.5, decimal: '1000.50' });
  });

  it('refuses a comma that does not group thousands', () => {
    expect(parseAmount('2,5', 'en')).toEqual({ kind: 'invalid' });
  });
});

describe('an amount in any language', () => {
  it.each(['1e3', '-5', 'abc', '1.234', '5.'])('refuses %s', (input) => {
    expect(parseAmount(input, 'ru')).toEqual({ kind: 'invalid' });
    expect(parseAmount(input, 'en')).toEqual({ kind: 'invalid' });
  });

  it('is empty when only spaces were typed', () => {
    expect(parseAmount('   ', 'en')).toEqual({ kind: 'empty' });
  });

  it('drops leading zeros so the server reads a plain decimal', () => {
    expect(parseAmount('007', 'en')).toEqual({ kind: 'amount', value: 7, decimal: '7' });
  });
});

describe('a trade cap', () => {
  it('accepts the cap itself', () => {
    expect(checkAmount(parseAmount('10 000', 'ru'), 10_000)).toEqual({
      kind: 'ok',
      value: 10000,
      decimal: '10000',
    });
  });

  it('names the cap as the problem one cent above it', () => {
    expect(checkAmount(parseAmount('10,000.01', 'en'), 10_000)).toEqual({ kind: 'problem', problem: 'max' });
  });

  it('refuses zero instead of clamping it', () => {
    expect(checkAmount(parseAmount('0', 'en'), 10_000)).toEqual({ kind: 'problem', problem: 'positive' });
  });

  it('reports an unreadable figure as a format problem', () => {
    expect(checkAmount(parseAmount('1e3', 'en'), 10_000)).toEqual({ kind: 'problem', problem: 'format' });
  });
});

describe('a count', () => {
  it('accepts a whole number within its bounds', () => {
    expect(checkCount(' 12 ', { min: 1, max: 50 })).toEqual({ kind: 'ok', value: 12 });
  });

  it('refuses a number outside its bounds instead of clamping it', () => {
    expect(checkCount('51', { min: 1, max: 50 })).toEqual({ kind: 'problem', problem: 'range' });
  });

  it('refuses a fraction', () => {
    expect(checkCount('2.5', { min: 1, max: 50 })).toEqual({ kind: 'problem', problem: 'format' });
  });
});
