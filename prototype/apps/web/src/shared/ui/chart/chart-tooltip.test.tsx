import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChartTooltip, ChartTooltipGroup, ChartTooltipRow } from './chart-tooltip';

afterEach(cleanup);

const renderTooltip = () =>
  render(
    <ChartTooltip frame={{ width: 600, height: 280 }} position={100} avoidY={null} title="12 May">
      <ChartTooltipGroup>
        <ChartTooltipRow label="APY" value="8.42%" color="var(--chart-1)" />
        <ChartTooltipRow label="Supply" value="$1,204" tone="context" />
      </ChartTooltipGroup>
    </ChartTooltip>,
  );

describe('ChartTooltip', () => {
  it('names the highlighted bucket beside every series reading', () => {
    renderTooltip();

    expect(screen.getByText('12 May')).toBeTruthy();
    expect(screen.getByText('8.42%')).toBeTruthy();
    expect(screen.getByText('$1,204')).toBeTruthy();
  });

  it('pins its box at the crosshair through a transform, so layout never feeds the measurement', () => {
    const { container } = renderTooltip();

    const box = container.firstElementChild as HTMLElement;

    expect([box.style.left, box.style.top, box.style.transform]).toEqual([
      '0px',
      '0px',
      'translate3d(112px, 8px, 0)',
    ]);
  });
});
