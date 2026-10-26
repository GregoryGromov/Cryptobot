import { useQuery } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { assetCode } from '~/shared/routing/topics';
import { homeAsks } from '../domain/prompts';

/** The questions home offers first, worded from what the market is doing now. */
export function useHomeStarters(): readonly string[] {
  const { t } = useT('conversation');
  const { t: format } = useT('format');
  const f = useFormatters();
  const signals = useQuery(trpc.views.signals.queryOptions());
  return homeAsks(signals.data ?? null).map((ask) =>
    match(ask)
      .with({ kind: 'why' }, ({ ticker, move, horizon }) =>
        t('home.ask.why', {
          code: assetCode(ticker),
          move: f.move(move),
          horizon: horizonWords(format, horizon),
        }),
      )
      .with({ kind: 'data' }, ({ ticker }) => t('home.ask.data', { code: assetCode(ticker) }))
      .with({ kind: 'start' }, () => t('home.ask.start'))
      .with({ kind: 'checks' }, () => t('home.ask.checks'))
      .exhaustive(),
  );
}
