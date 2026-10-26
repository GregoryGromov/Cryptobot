import type { ForecastNote } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match, P } from 'ts-pattern';
import type { Formatters } from '~/shared/format/use-formatters';
import { horizonWords } from '../domain/verdict';

export const planWords = (
  plan: ForecastNote['plan'],
  t: TFunction<'forecast'>,
  format: TFunction<'format'>,
  fmt: Formatters,
): string =>
  match(plan)
    .with({ action: 'FLAT' }, () => t('why.plan.flat'))
    .with({ action: P.union('LONG', 'SHORT') }, (p) =>
      t('why.plan.trade', {
        side: format(`action.${p.action}`),
        term: horizonWords(format, p.horizon),
        size: fmt.percent(p.sizePct, 0),
        stop: fmt.change(-p.stopPct, 1),
        target: fmt.change(p.targetPct, 1),
      }),
    )
    .exhaustive();

export const unscoredWords = (cohort: ForecastNote['cohort'], format: TFunction<'format'>): string | null =>
  match(cohort)
    .with(P.union('official', 'on-demand'), () => null)
    .with(P.union('late', 'non-official-timing'), (c) => format(`cohort.${c}`))
    .exhaustive();
