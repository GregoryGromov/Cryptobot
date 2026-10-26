import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useT } from '~/shared/i18n';
import {
  checkMark,
  checkWords,
  forecastCheckWords,
  leanOf,
  leanTenthsWords,
  leanWords,
  recordWords,
  skillWords,
  termsWords,
} from './verdict';

const format = () => renderHook(() => useT('format')).result.current.t;
const forecast = () => renderHook(() => useT('forecast')).result.current.t;
const span = (ms: number) => `${ms / 60_000} мин`;

describe('leanOf', () => {
  it('takes the outcome with the most tenths', () => {
    expect(leanOf({ p_up: 0.62, p_flat: 0.23, p_down: 0.15 })).toEqual({ cls: 'UP', tenths: 6 });
  });

  it('has no lean when the top two are equal', () => {
    expect(leanOf({ p_up: 0.44, p_flat: 0.12, p_down: 0.44 })).toBeNull();
  });

  it('treats odds that round to the same tenths as a tie', () => {
    expect(leanOf({ p_up: 0.44, p_flat: 0.2, p_down: 0.36 })).toBeNull();
  });

  it('leans when rounding separates close odds', () => {
    expect(leanOf({ p_up: 0.46, p_flat: 0.2, p_down: 0.34 })).toEqual({ cls: 'UP', tenths: 5 });
  });
});

describe('lean words', () => {
  it('says a clear lean as likely', () => {
    expect(leanWords(format(), { p_up: 0.1, p_flat: 0.2, p_down: 0.7 })).toBe('Скорее вниз');
  });

  it('says a weak lean as slightly more likely', () => {
    expect(leanWords(format(), { p_up: 0.46, p_flat: 0.2, p_down: 0.34 })).toBe('Чуть вероятнее вверх');
  });

  it('says a tie as unclear', () => {
    expect(leanWords(format(), { p_up: 0.4, p_flat: 0.2, p_down: 0.4 })).toBe('Направление неясно');
  });

  it('gives the lean with its tenths', () => {
    expect(leanTenthsWords(forecast(), { p_up: 0.62, p_flat: 0.23, p_down: 0.15 })).toBe('вверх 6 из 10');
  });

  it('gives no tenths for a tie', () => {
    expect(leanTenthsWords(forecast(), { p_up: 0.4, p_flat: 0.2, p_down: 0.4 })).toBe('поровну');
  });
});

describe('check words', () => {
  it('confirms a lean that came true', () => {
    expect(checkWords(format(), 'UP', 'UP')).toBe('как брокер и считал вероятнее');
  });

  it('names what the broker held more likely when it did not come', () => {
    expect(checkWords(format(), 'UP', 'DOWN')).toBe('брокер считал вероятнее «вверх»');
  });

  it('marks a flat outcome against a move as flat', () => {
    expect(checkMark('UP', 'FLAT')).toBe('flat');
  });

  it('marks a move the other way as a miss', () => {
    expect(checkMark('UP', 'DOWN')).toBe('miss');
  });

  it('marks nothing without a lean', () => {
    expect(checkMark(null, 'DOWN')).toBe('none');
  });

  it('says when a waiting check comes', () => {
    expect(forecastCheckWords(format(), span, { status: 'waiting', checkAt: 10 * 60_000 }, 4 * 60_000)).toBe(
      'Проверка через 6 мин',
    );
  });

  it('says a past due check is awaited', () => {
    expect(forecastCheckWords(format(), span, { status: 'waiting', checkAt: 0 }, 60_000)).toBe(
      'Ожидаем проверку',
    );
  });
});

describe('record words', () => {
  it('says few data with the number of checks', () => {
    expect(recordWords(format(), { n: 4, provisional: true, skill: 0.3 })).toBe(
      'пока мало данных · 4 проверки',
    );
  });

  it('says better than statistics past the margin', () => {
    expect(skillWords(format(), { n: 120, provisional: false, skill: 0.05 })).toBe(
      'лучше рыночной статистики',
    );
  });

  it('says a skill inside the margin is not distinguishable', () => {
    expect(skillWords(format(), { n: 120, provisional: false, skill: 0.01 })).toBe(
      'пока не отличить от рыночной статистики',
    );
  });
});

describe('terms words', () => {
  it('joins several horizons with the last one apart', () => {
    expect(termsWords(format(), [5, 15, 60], ' и ')).toBe('5 мин, 15 мин и 1 ч');
  });

  it('says a single horizon alone', () => {
    expect(termsWords(format(), [30], ' и ')).toBe('30 мин');
  });
});
