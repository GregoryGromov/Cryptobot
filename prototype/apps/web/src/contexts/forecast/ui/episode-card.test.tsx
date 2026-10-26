import type { Inputs, MarketName, Pulse, Why } from '@reinforce/server/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trpc } from '~/shared/api/trpc';
import { candle, forecastNote, T0 } from '../forecast-fixture';
import { EpisodeCard } from './episode-card';

vi.mock('./use-signal-chart', () => ({ useSignalChart: () => undefined }));

const MINUTE = 60_000;

const market: MarketName = { coin: 'BTC', ticker: 'BTC', name: 'Биткоин', cls: 'majors' };

const pulse: Pulse = {
  accountId: null,
  now: T0 + 6 * MINUTE,
  telegramLinkId: null,
  conversations: {},
  market: { phase: 'ready', lastBarEnd: T0 + 6 * MINUTE, message: null, loaded: 1, total: 1 },
};

const why: Why = {
  asOf: T0,
  points: [
    {
      claim: 'Сила покупателей ещё не выдохлась',
      stance: 'up',
      weight: 'high',
      horizons: [5, 15],
      value: 'RSI 72',
      caption: 'Индекс силы: где он сейчас и где был',
      figure: {
        kind: 'scale',
        min: 0,
        max: 100,
        zones: [],
        trail: [{ label: 'при прогнозе', value: 72 }],
        range: null,
        ends: null,
      },
      row: 'rsi',
    },
    {
      claim: 'Объём выше обычного',
      stance: 'up',
      weight: 'medium',
      horizons: [15],
      value: '×2,4',
      caption: 'Объём за пять минут против обычного',
      figure: { kind: 'ratio', value: 2.4 },
      row: 'volume',
    },
  ],
};

const row = (id: string) => ({ kind: 'value' as const, id, label: id, hint: '', text: '1' });

const inputs: Inputs = {
  asOf: T0,
  candles: [],
  groups: [
    { id: 'move', rows: [row('returns'), row('shock'), row('rarity')] },
    { id: 'indicators', rows: [row('rsi'), row('macd')] },
  ],
  cited: ['rsi'],
  markets: 22,
  quality: { bars: 120, missing: 0, valid: true, detector: null, features: null },
};

function Card({ opened }: { readonly opened: boolean }) {
  const [open, setOpen] = useState(opened);
  return (
    <EpisodeCard
      forecast={forecastNote()}
      signal={null}
      market={market}
      open={open}
      onToggle={() => setOpen(!open)}
      record={null}
    />
  );
}

const renderCard = (open: boolean) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(trpc.views.pulse.queryKey(), pulse);
  client.setQueryData(trpc.views.threadChart.queryKey('th1'), {
    candles: [candle(-2, 99.9), candle(-1, 100), candle(0, 100.3)],
    step: 1,
    historical: true,
  });
  client.setQueryData(trpc.views.forecastWhy.queryKey('f1'), why);
  client.setQueryData(trpc.views.forecastInputs.queryKey('f1'), inputs);
  return render(
    <QueryClientProvider client={client}>
      <Card opened={open} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

const log = () => screen.getByRole('button', { name: /^Изучил/ });

describe('EpisodeCard', () => {
  it('heads the card with his lean on the horizon the person trades', () => {
    renderCard(false);

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Скорее вверх');
  });

  it('says beside the lean how many tenths it has', () => {
    renderCard(false);

    expect(screen.getByRole('heading', { level: 3 }).parentElement?.textContent).toContain('6 из 10');
  });

  it('sums up in one line what the broker studied', () => {
    renderCard(false);

    expect(log().textContent).toBe('Изучил 120 минут торгов, 5 показателей и 22 рынка');
  });

  it('keeps his reasons folded until the line is opened', async () => {
    const user = userEvent.setup();
    renderCard(false);

    expect(log().getAttribute('aria-expanded')).toBe('false');
    await user.click(log());

    expect(log().getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByRole('button', { name: /Объём выше обычного/ })).toBeTruthy();
  });

  it('opens a reason’s picture under that reason only', async () => {
    const user = userEvent.setup();
    renderCard(true);

    await user.click(screen.getByRole('button', { name: /Объём выше обычного/ }));

    const [first, second] = screen
      .getAllByRole('listitem')
      .filter((item) => item.querySelector('[aria-expanded]'));
    expect(
      within(second ?? document.body).getByRole('img', { name: 'Обычно ×1, при прогнозе ×2,4' }),
    ).toBeTruthy();
    expect(second?.textContent).toContain('Объём за пять минут против обычного');
    expect(first?.textContent).not.toContain('Индекс силы: где он сейчас и где был');
  });

  it('puts a reason’s small picture away while its big one is open', async () => {
    const user = userEvent.setup();
    renderCard(true);
    const reason = screen.getByRole('button', { name: /Объём выше обычного/ });

    await user.click(reason);

    expect(
      screen
        .getAllByRole('button', { name: /обычного|выдохлась/ })
        .map((button) => button.querySelector('[data-shown]')?.getAttribute('data-shown')),
    ).toEqual(['true', 'false']);
  });

  it('says under the reasons what would change the broker’s mind', () => {
    renderCard(true);

    expect(screen.getByText(/^Брокер передумает/, { selector: 'p' }).textContent).toMatch(
      /^Брокер передумает, если биткоин опустится ниже 99,20\s\$ — это минимум за два часа\.$/,
    );
  });

  it('draws the market under the verdict with its candle frames', () => {
    renderCard(false);

    expect(
      within(screen.getByRole('radiogroup', { name: 'Свеча' }))
        .getAllByRole('radio')
        .map((frame) => frame.textContent),
    ).toEqual(['1м', '5м', '15м', '1ч']);
  });
});
