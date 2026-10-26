import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type Locale, useT } from '~/shared/i18n';
import { closedTrade, openTrade, pendingTrade, rejectedTrade, T0 } from '../testing/fixtures';
import { tradeAmount, tradeResult, tradeStatusText } from './trade-status';

const tradingT = (lng: Locale) => renderHook(() => useT('trading', { lng })).result.current.t;

const words = () => ({
  t: tradingT('ru'),
  clock: (at: number) => `${(at - T0) / 60_000}м`,
});

describe('tradeStatusText', () => {
  it('names the minute an order waits to enter at', () => {
    expect(tradeStatusText(words(), pendingTrade({ waitingFor: 'time', entryAt: T0 + 60_000 }))).toBe(
      'Вход в 1м',
    );
  });

  it('says an order waits for its entry price', () => {
    expect(tradeStatusText(words(), pendingTrade({ waitingFor: 'prices' }))).toBe('Ждём цену входа');
  });

  it('says an order is being filled', () => {
    expect(tradeStatusText(words(), pendingTrade({ waitingFor: 'execution' }))).toBe('Исполняем вход');
  });

  it('gives the reason an order was not filled', () => {
    expect(tradeStatusText(words(), rejectedTrade({ reason: 'invalid-levels' }))).toBe(
      'Не исполнена: стоп или цель оказались по ту сторону цены входа',
    );
  });

  it('dates the price an open trade is valued at', () => {
    expect(tradeStatusText(words(), openTrade({ markAt: T0 + 5 * 60_000 }))).toBe('Цена на 5м');
  });

  it('says a priced trade has no price yet when the mark is missing', () => {
    expect(tradeStatusText(words(), openTrade({ markAt: null }))).toBe('Цены пока нет');
  });

  it('says an open trade waits for missing prices', () => {
    expect(tradeStatusText(words(), openTrade({ valuation: 'awaiting-prices' }))).toBe(
      'Ждём недостающие цены',
    );
  });

  it('says an open trade is being settled', () => {
    expect(tradeStatusText(words(), openTrade({ valuation: 'awaiting-settlement' }))).toBe(
      'Считаем закрытие',
    );
  });

  it('tells how and when a trade closed', () => {
    expect(tradeStatusText(words(), closedTrade())).toBe('Закрыта по цели в 9м');
  });

  it('warns when the stop and the target fell in one minute', () => {
    const row = closedTrade({
      ambiguous: true,
      exit: { at: T0 + 3 * 60_000, refPrice: 1980, price: 1979.6, fee: 0.23, reason: 'stop-loss' },
    });
    expect(tradeStatusText(words(), row)).toBe('Закрыта по стопу в 3м · стоп и цель задеты в одну минуту');
  });

  it('speaks English on an English page', () => {
    expect(tradeStatusText({ t: tradingT('en'), clock: () => '12:09' }, closedTrade())).toBe(
      'Closed at the target at 12:09',
    );
  });
});

describe('tradeResult', () => {
  it('has no result before the entry', () => {
    expect(tradeResult(pendingTrade())).toEqual({ kind: 'none' });
  });

  it('keeps an unpriced open trade unvalued instead of zero', () => {
    expect(tradeResult(openTrade({ unrealized: null }))).toEqual({ kind: 'unvalued' });
  });

  it('takes the closed result from the server', () => {
    expect(tradeResult(closedTrade({ pnl: -4.5 }))).toEqual({ kind: 'pnl', pnl: -4.5 });
  });
});

describe('tradeAmount', () => {
  it('reads the requested amount of an order not yet filled', () => {
    expect(tradeAmount(pendingTrade({ requested: 250 }))).toBe(250);
  });

  it('reads the filled notional of an entered trade', () => {
    expect(tradeAmount(openTrade({ notional: 499.9 }))).toBe(499.9);
  });
});
