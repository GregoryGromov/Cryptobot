import type { TradeRow } from '@reinforce/server/dto';
import type { AppRouter } from '@reinforce/server/router';
import { Button } from '@reinforce/ui-react/button';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { Link } from '@tanstack/react-router';
import type { inferRouterOutputs } from '@trpc/server';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { tradeAmount, tradeResult } from '~/contexts/trading/domain/trade-status';
import { TradeChart } from '~/contexts/trading/ui/trade-chart';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { Numeral } from '~/shared/ui/numeral';
import { tradeFees } from '../domain/trade-detail-vm';

type TradeChartData = inferRouterOutputs<AppRouter>['views']['tradeChart'];

type ChartQuery = {
  readonly data: TradeChartData | undefined;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => unknown;
};

function Fact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-figure">{children}</dd>
    </div>
  );
}

function Levels({ row }: { readonly row: TradeRow }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  return match(row)
    .with({ status: 'open' }, { status: 'closed' }, (r) => (
      <>
        <Fact label={t('detail.entry')}>{fmt.price(r.entry.price)}</Fact>
        <Fact label={t('detail.stop')}>{fmt.price(r.stopPrice)}</Fact>
        <Fact label={t('detail.take')}>{fmt.price(r.takePrice)}</Fact>
        {r.status === 'closed' && <Fact label={t('detail.exit')}>{fmt.price(r.exit.price)}</Fact>}
      </>
    ))
    .with({ status: 'pending' }, { status: 'rejected' }, (r) => {
      const sign = r.side === 'LONG' ? 1 : -1;
      return (
        <>
          <Fact label={t('detail.stop')}>{fmt.change(-sign * r.stopLossPct)}</Fact>
          <Fact label={t('detail.take')}>{fmt.change(sign * r.takeProfitPct)}</Fact>
        </>
      );
    })
    .exhaustive();
}

function Result({ row }: { readonly row: TradeRow }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  return match(tradeResult(row))
    .with({ kind: 'pnl' }, ({ pnl }) => (
      <Fact label={t('detail.result')}>
        <Numeral tone="direction" direction={directionOf(pnl, 2)} weight="semibold">
          {fmt.usdSigned(pnl)}
        </Numeral>
      </Fact>
    ))
    .with({ kind: 'unvalued' }, () => (
      <Fact label={t('detail.result')}>
        <span className="text-muted-foreground">{t('trades.unvalued')}</span>
      </Fact>
    ))
    .with({ kind: 'none' }, () => null)
    .exhaustive();
}

export function TradeDetail({ row, chart }: { readonly row: TradeRow; readonly chart: ChartQuery }) {
  const { t } = useT('portfolio');
  const { t: tt } = useT('trading');
  const { t: tf } = useT('format');
  const fmt = useFormatters();
  const amount = tradeAmount(row);
  const fees = tradeFees(row);
  const live = row.status === 'pending' || row.status === 'open';
  return (
    <div className="flex flex-col gap-4">
      {(row.status === 'open' || row.status === 'closed') && (
        <AsyncView
          query={chart}
          errorTitle={tt('chart.failed')}
          loading={<Skeleton className="h-56 w-full" />}
        >
          {(data) => <TradeChart trade={data.trade} candles={data.candles} market={row.name} size="full" />}
        </AsyncView>
      )}
      <dl className="flex flex-col divide-y divide-border/60 text-sm">
        <Result row={row} />
        {amount !== null && <Fact label={t('detail.amount')}>{fmt.usd(amount)}</Fact>}
        <Levels row={row} />
        {fees !== null && <Fact label={t('detail.fees')}>{fmt.usd(fees)}</Fact>}
        <Fact label={t('detail.term')}>{horizonWords(tf, row.horizon)}</Fact>
        {live && <Fact label={t('detail.closes')}>{fmt.dateTime(row.exitDeadline)}</Fact>}
      </dl>
      <Button asChild variant="secondary" className="self-start">
        <Link {...topicLink(row.coin)} search={row.threadId === null ? {} : { idea: row.threadId }}>
          {row.threadId === null ? t('detail.topic') : t('detail.idea')}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
