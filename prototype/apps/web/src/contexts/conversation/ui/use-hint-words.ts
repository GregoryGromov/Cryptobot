import type { Quote } from '@reinforce/server/dto';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { type HintWords, movedNotably } from '../domain/prompts';

export function useHintWords(market: Quote | null = null): HintWords {
  const { t } = useT('conversation');
  const f = useFormatters();
  const change = market?.change1h ?? null;
  return {
    starters: [],
    analysis: [
      movedNotably(change)
        ? t('next.analysis.moved', { change: f.change(change, 1) })
        : t('next.analysis.now'),
      t('next.analysis.enter'),
      t('next.analysis.risk'),
    ],
    enter: t('next.analysis.enter'),
    again: t('next.again'),
  };
}
