import type { SignalRow, SignalView } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';
import { timesOf } from '../domain/waves';

export const signalDirectionClass = (direction: SignalView['direction']): string =>
  match(direction)
    .with('UP', () => 'text-up')
    .with('DOWN', () => 'text-down')
    .exhaustive();

const scopeWords = (scope: SignalView['scope'], format: TFunction<'format'>): string | null =>
  match(scope)
    .with('IDIOSYNCRATIC', 'BROAD', 'MARKET_WIDE', (s) => format(`scope.${s}`))
    .with('UNKNOWN', () => null)
    .exhaustive();

export const timesWords = (signal: Pick<SignalView, 'times'>, t: TFunction<'signals'>): string => {
  const count = timesOf(signal);
  return count === null ? t('notably') : t('times', { count });
};

export const factsWords = (
  signal: SignalView,
  t: TFunction<'signals'>,
  format: TFunction<'format'>,
): readonly string[] =>
  [
    timesWords(signal, t),
    signal.volumeConfirmed ? t('volume') : null,
    scopeWords(signal.scope, format),
  ].filter((fact) => fact !== null);

export const withWords = (others: readonly SignalRow[], t: TFunction<'signals'>): string =>
  t('with', { count: others.length });

const NAMED_WITH = 2;

export const withNamesWords = (
  others: readonly Pick<SignalRow, 'name'>[],
  t: TFunction<'signals'>,
): string => {
  const names = others
    .slice(0, NAMED_WITH)
    .map((other) => other.name)
    .join(', ');
  const rest = others.length - NAMED_WITH;
  return rest > 0 ? t('live.withMore', { names, count: rest }) : t('live.with', { names });
};
