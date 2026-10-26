import type { SignalView } from '@reinforce/server/dto';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SignalFact } from './episode-head';

const signal: SignalView = {
  eventId: 'e1',
  eventAt: Date.UTC(2026, 9, 15, 14, 1),
  staleAt: Date.UTC(2026, 9, 15, 14, 31),
  move: 0.41,
  horizon: 5,
  direction: 'UP',
  scope: 'IDIOSYNCRATIC',
  volumeConfirmed: true,
  times: 12.3,
  spark: null,
};

afterEach(cleanup);

describe('SignalFact', () => {
  it('names the signal as Reinforce’s own', () => {
    render(<SignalFact head={null} signal={signal} forecast={{ at: signal.eventAt }} offer />);

    expect(screen.getByRole('region', { name: 'Сигнал Reinforce' })).toBeTruthy();
  });

  it('gives its move and how many times stronger than usual it was', () => {
    render(<SignalFact head={null} signal={signal} forecast={{ at: signal.eventAt }} offer={false} />);

    const region = screen.getByRole('region', { name: 'Сигнал Reinforce' });
    expect(region.textContent).toContain('+0,41');
    expect(region.textContent).toContain('×12');
  });

  it('says the trade below came of it', () => {
    render(<SignalFact head={null} signal={signal} forecast={{ at: signal.eventAt }} offer />);

    expect(screen.getByText('Брокер разобрал его и предлагает сделку')).toBeTruthy();
  });
});
