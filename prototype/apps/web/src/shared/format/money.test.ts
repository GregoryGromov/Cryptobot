import { describe, expect, it } from 'vitest';
import { formatPrice, formatUsd, formatUsdSigned, formatUsdWhole } from './money';

describe('money formatting', () => {
  it('truncates cents instead of rounding a balance up', () => {
    expect(formatUsd(1.239, 'en-US')).toBe('$1.23');
  });

  it('says a non-zero amount under a cent is under a cent', () => {
    expect(formatUsd(0.004, 'en-US')).toBe('< $0.01');
  });

  it('writes a loss with a typographic minus', () => {
    expect(formatUsdSigned(-12.5, 'en-US')).toBe('−$12.50');
  });

  it('shows no sign for a result that is zero', () => {
    expect(formatUsdSigned(0, 'en-US')).toBe('$0.00');
  });

  it('places the dollar sign the way the locale does', () => {
    expect(formatUsdWhole(10000, 'ru-RU')).toBe('10 000 $');
  });

  it('gives a large price no decimals and a small one enough to move', () => {
    expect(formatPrice(58686.4, 'en-US')).toBe('$58,686');
    expect(formatPrice(0.0004213, 'en-US')).toBe('$0.0004213');
  });
});
