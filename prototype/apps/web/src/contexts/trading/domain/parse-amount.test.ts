import { describe, expect, it } from 'vitest';
import { parseAmount, parsePercent } from './parse-amount';

describe('parseAmount', () => {
  it('reads a Russian amount grouped with a space', () => {
    expect(parseAmount('1 000', 'ru')).toEqual({ kind: 'ok', decimal: '1000', value: 1000 });
  });

  it('reads a Russian amount grouped with a non-breaking space', () => {
    expect(parseAmount('12 500', 'ru')).toEqual({ kind: 'ok', decimal: '12500', value: 12500 });
  });

  it('reads a Russian decimal comma', () => {
    expect(parseAmount('2,5', 'ru')).toEqual({ kind: 'ok', decimal: '2.5', value: 2.5 });
  });

  it('reads a decimal point typed on a Russian page', () => {
    expect(parseAmount('2.75', 'ru')).toEqual({ kind: 'ok', decimal: '2.75', value: 2.75 });
  });

  it('reads an English amount with grouping commas and cents', () => {
    expect(parseAmount('1,000.50', 'en')).toEqual({ kind: 'ok', decimal: '1000.5', value: 1000.5 });
  });

  it('keeps a trailing separator while the amount is being typed', () => {
    expect(parseAmount('12,', 'ru')).toEqual({ kind: 'ok', decimal: '12', value: 12 });
  });

  it('drops leading zeros of the whole part', () => {
    expect(parseAmount('007', 'en')).toEqual({ kind: 'ok', decimal: '7', value: 7 });
  });

  it('calls an empty field empty', () => {
    expect(parseAmount('   ', 'ru')).toEqual({ kind: 'error', problem: 'empty' });
  });

  it('refuses letters', () => {
    expect(parseAmount('12abc', 'en')).toEqual({ kind: 'error', problem: 'format' });
  });

  it('refuses a negative amount', () => {
    expect(parseAmount('-5', 'en')).toEqual({ kind: 'error', problem: 'format' });
  });

  it('refuses broken grouping', () => {
    expect(parseAmount('10 00', 'ru')).toEqual({ kind: 'error', problem: 'format' });
  });

  it('refuses an English comma used as a decimal separator', () => {
    expect(parseAmount('1,00', 'en')).toEqual({ kind: 'error', problem: 'format' });
  });

  it('refuses two decimal separators', () => {
    expect(parseAmount('1,5.5', 'ru')).toEqual({ kind: 'error', problem: 'format' });
  });

  it('refuses fractions of a cent instead of cutting them', () => {
    expect(parseAmount('10,555', 'ru')).toEqual({ kind: 'error', problem: 'precision' });
  });
});

describe('parsePercent', () => {
  it('reads a Russian percent with a comma', () => {
    expect(parsePercent('1,5', 'ru')).toEqual({ kind: 'ok', decimal: '1.5', value: 1.5 });
  });

  it('refuses a percent sign typed into the field', () => {
    expect(parsePercent('2%', 'en')).toEqual({ kind: 'error', problem: 'format' });
  });
});
