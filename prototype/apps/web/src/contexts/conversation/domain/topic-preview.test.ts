import type { ChatRow, Chats } from '@reinforce/server/dto';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formattersFor } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { type PreviewWords, previewText } from './topic-preview';

const words = (): PreviewWords => {
  const { result } = renderHook(() => ({ conversation: useT('conversation').t, format: useT('format').t }));
  return { ...result.current, fmt: formattersFor('ru-RU') };
};

const general = (preview: ChatRow['preview']): ChatRow => ({
  key: 'broker',
  preview,
  at: 1,
  unread: 0,
  spoken: true,
});

const market = (overrides: Partial<Chats['markets'][number]>): ChatRow => ({
  key: 'BTC',
  preview: null,
  at: 0,
  unread: 0,
  spoken: false,
  coin: 'BTC',
  name: 'Bitcoin',
  ticker: 'BTC',
  cls: 'majors',
  price: 60_123.45,
  change1h: 1.234,
  watched: true,
  position: null,
  ...overrides,
});

describe('previewText', () => {
  it('quotes a market where nothing was said yet', () => {
    expect(previewText(market({}), words())).toBe('60 123 $ · +1,23 % за час');
  });

  it('shows only the price when the hour has no change yet', () => {
    expect(previewText(market({ price: 2.5, change1h: null }), words())).toBe('2,50 $');
  });

  it('says nothing for a market without a price', () => {
    expect(previewText(market({ price: null }), words())).toBe('');
  });

  it('says nothing for a conversation where nothing was said yet', () => {
    expect(previewText(general(null), words())).toBe('');
  });

  it('marks the user’s own words', () => {
    expect(previewText(general({ kind: 'text', at: 1, role: 'user', text: 'Что с нефтью?' }), words())).toBe(
      'Вы: Что с нефтью?',
    );
  });

  it('keeps the broker’s words as they are', () => {
    expect(
      previewText(general({ kind: 'text', at: 1, role: 'broker', text: 'Рынок спокоен.' }), words()),
    ).toBe('Рынок спокоен.');
  });

  it('folds a forecast into its lean and its trade', () => {
    const preview: ChatRow['preview'] = {
      kind: 'forecast',
      at: 1,
      horizon: 15,
      probs: { p_up: 0.62, p_flat: 0.2, p_down: 0.18 },
      action: 'LONG',
      proposal: { side: 'LONG', sizeUsd: 250.75 },
    };
    expect(previewText(market({ preview }), words())).toBe('Скорее вверх · на рост 250 $');
  });

  it('says there is no trade when the forecast stays flat', () => {
    const preview: ChatRow['preview'] = {
      kind: 'forecast',
      at: 1,
      horizon: 30,
      probs: { p_up: 0.34, p_flat: 0.33, p_down: 0.33 },
      action: 'FLAT',
      proposal: null,
    };
    expect(previewText(market({ preview }), words())).toBe('Направление неясно · сделки нет');
  });

  it('names a trade idea with its amount', () => {
    expect(
      previewText(market({ preview: { kind: 'proposal', at: 1, side: 'SHORT', sizeUsd: 100 } }), words()),
    ).toBe('Идея: на падение, 100 $');
  });

  it('tells a signal by its move and horizon', () => {
    expect(
      previewText(
        market({ preview: { kind: 'signal', at: 1, move: -0.42, horizon: 5, direction: 'DOWN' } }),
        words(),
      ),
    ).toBe('−0,42 % за 5 мин, сильнее обычного');
  });

  it('says the broker is busy while he analyzes', () => {
    expect(previewText(market({ preview: { kind: 'busy', at: 1 } }), words())).toBe('разбирает…');
  });
});
