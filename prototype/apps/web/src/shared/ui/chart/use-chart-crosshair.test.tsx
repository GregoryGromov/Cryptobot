import type { PlotFrame } from '@reinforce/ui-primitives/charts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { settleCrosshair, useChartCrosshair } from './use-chart-crosshair';

afterEach(cleanup);

const frame: PlotFrame = { width: 40, padLeft: 0, padRight: 0 };

function CrosshairSurface({ active }: { readonly active: boolean }) {
  const crosshair = useChartCrosshair({ positions: [0, 10, 20, 30], frame, active });
  return (
    <div
      data-testid="plot"
      data-index={crosshair.index ?? 'none'}
      {...crosshair.handlers}
      {...crosshair.keyboardHandlers}
    >
      <button type="button" data-testid="inner-control">
        Export
      </button>
    </div>
  );
}

const plot = () => screen.getByTestId('plot');

const hoverAt = (clientX: number) => fireEvent.pointerMove(plot(), { pointerId: 1, clientX, clientY: 0 });

describe('settleCrosshair', () => {
  it('drops the highlighted pointer when a pan takes over', () => {
    expect(settleCrosshair({ active: true, x: 21 }, false)).toEqual({ active: false, x: null });
  });

  it('keeps the tap that landed while the pan was releasing', () => {
    expect(settleCrosshair({ active: false, x: 21 }, true)).toEqual({ active: true, x: 21 });
  });

  it('leaves an unchanged flag alone', () => {
    const state = { active: true, x: 21 };

    expect(settleCrosshair(state, true)).toBe(state);
  });
});

describe('useChartCrosshair', () => {
  it('follows the pointer to the nearest plotted point', async () => {
    render(<CrosshairSurface active />);

    hoverAt(21);

    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('2'));
  });

  it('holds the crosshair inside the plot when the pointer runs past it', async () => {
    render(<CrosshairSurface active />);

    hoverAt(500);

    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('3'));
  });

  it('clears the crosshair when the pointer leaves the plot', async () => {
    render(<CrosshairSurface active />);
    hoverAt(21);
    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('2'));

    fireEvent.pointerLeave(plot(), { pointerId: 1 });

    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('none'));
  });

  it('forgets the crosshair once a pan starts', async () => {
    const { rerender } = render(<CrosshairSurface active />);
    hoverAt(21);
    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('2'));

    rerender(<CrosshairSurface active={false} />);
    expect(plot().getAttribute('data-index')).toBe('none');

    rerender(<CrosshairSurface active />);
    expect(plot().getAttribute('data-index')).toBe('none');
  });

  it('walks the crosshair one point per arrow press, with no pointer involved', () => {
    render(<CrosshairSurface active />);

    fireEvent.keyDown(plot(), { key: 'ArrowRight' });
    fireEvent.keyDown(plot(), { key: 'ArrowRight' });

    expect(plot().getAttribute('data-index')).toBe('1');
  });

  it('jumps to the newest point on End', () => {
    render(<CrosshairSurface active />);

    fireEvent.keyDown(plot(), { key: 'End' });

    expect(plot().getAttribute('data-index')).toBe('3');
  });

  it('drops the crosshair on Escape', () => {
    render(<CrosshairSurface active />);
    fireEvent.keyDown(plot(), { key: 'End' });

    fireEvent.keyDown(plot(), { key: 'Escape' });

    expect(plot().getAttribute('data-index')).toBe('none');
  });

  it('leaves End to the control the user is actually focused on inside the panel', () => {
    render(<CrosshairSurface active />);

    const bubbled = fireEvent.keyDown(screen.getByTestId('inner-control'), { key: 'End' });

    expect(plot().getAttribute('data-index')).toBe('none');
    expect(bubbled).toBe(true);
  });

  it('ignores pointer travel spent panning the chart', async () => {
    const { rerender } = render(<CrosshairSurface active={false} />);

    hoverAt(21);
    await waitFor(() => expect(plot().getAttribute('data-index')).toBe('none'));
    rerender(<CrosshairSurface active />);

    expect(plot().getAttribute('data-index')).toBe('none');
  });
});
