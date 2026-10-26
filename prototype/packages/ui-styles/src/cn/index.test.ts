import { describe, expect, it } from 'vitest';
import { cn } from './index.js';

describe('cn', () => {
  it('a later Tailwind utility wins over an earlier one in the same group', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('keeps a text colour beside the kit text sizes meta and row', () => {
    expect(cn('text-foreground-soft text-row', 'text-success')).toBe('text-row text-success');
    expect(cn('text-sm', 'text-meta')).toBe('text-meta');
  });
});
