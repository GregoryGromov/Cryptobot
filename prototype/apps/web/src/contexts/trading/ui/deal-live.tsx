import type { TradeRow } from '@reinforce/server/dto';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useInView } from '~/shared/hooks/use-in-view';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { tradeStatusText } from '../domain/trade-status';
import { TradeChart } from './trade-chart';

export function DealLive({ trade, market }: { readonly trade: TradeRow; readonly market: string }) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const { ref, seen } = useInView<HTMLDivElement>();
  const chart = useQuery(
    trpc.views.tradeChart.queryOptions(trade.id, { enabled: seen, meta: { silent: true } }),
  );
  return (
    <div ref={ref} className="flex flex-col gap-2">
      {trade.status === 'open' && (
        <p className="text-meta text-muted-foreground">{tradeStatusText({ t, clock: fmt.clock }, trade)}</p>
      )}
      <AppBoundary tier="panel" scope="deal-chart">
        <AsyncView
          query={chart}
          errorTitle={t('chart.failed')}
          loading={<Skeleton className="h-24 w-full" />}
        >
          {(data) => <TradeChart trade={data.trade} candles={data.candles} market={market} size="compact" />}
        </AsyncView>
      </AppBoundary>
    </div>
  );
}
