import { Skeleton } from '@reinforce/ui-react/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { periodMoves } from '~/contexts/markets/domain/market-moves';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { PANEL_TITLE_CLASS, SIDE_ROW_CLASS } from './terminal-layout';

const ROWS = ['a', 'b', 'c', 'd'] as const;

/** How far the market went over the last hour, four hours, day and week. */
export function MarketMoves({ coin }: { readonly coin: string }) {
  const { t } = useT('markets');
  const f = useFormatters();
  const id = useId();
  const fiveMinute = useQuery(
    trpc.views.candles.queryOptions({ coin, frame: '5m' }, { meta: { silent: true } }),
  );
  const hourly = useQuery(trpc.views.candles.queryOptions({ coin, frame: '1h' }, { meta: { silent: true } }));
  if (fiveMinute.isError) return null;
  const moves = fiveMinute.data ? periodMoves(fiveMinute.data, hourly.data ?? []) : null;
  if (moves?.length === 0) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h2 id={id} className={PANEL_TITLE_CLASS}>
        {t('moves.title')}
      </h2>
      {moves === null ? (
        <div className="flex flex-col gap-2.5 py-1">
          {ROWS.map((row) => (
            <Skeleton key={row} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <dl className="flex flex-col">
          {moves.map((move) => (
            <div key={move.period} className={SIDE_ROW_CLASS}>
              <dt className="text-muted-foreground">{t(`moves.${move.period}`)}</dt>
              <dd>
                <Numeral tone="direction" direction={directionOf(move.change, 2)} weight="semibold">
                  {f.change(move.change, 2)}
                </Numeral>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
