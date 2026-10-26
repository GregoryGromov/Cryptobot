import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DealFlat } from './deal-flat';

afterEach(cleanup);

describe('DealFlat', () => {
  it('tells not to open a trade and why, on the forecast’s term', () => {
    render(<DealFlat horizon={30} />);

    const region = screen.getByRole('region', { name: 'Сделку не открывать' });
    expect(region.textContent).toContain('Стороны нет на 30 мин — лучше переждать');
  });

  it('is a word, not a button to press', () => {
    render(<DealFlat horizon={5} />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
