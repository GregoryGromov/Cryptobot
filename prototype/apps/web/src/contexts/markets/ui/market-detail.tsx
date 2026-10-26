import type { MarketList } from '@reinforce/server/dto';
import { useQuery } from '@tanstack/react-query';
import { useLaunch } from '~/contexts/conversation/api/launch';
import { useSendMessage } from '~/contexts/conversation/api/mutations';
import type { Span } from '~/contexts/markets/domain/chart-vm';
import { type ListedMarket, marketSignals, nameOf } from '~/contexts/markets/domain/market-list-vm';
import { browserTimeZone } from '~/contexts/settings/domain/quiet-hours';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { MarketChart } from './market-chart';
import { MarketCompareBlock } from './market-compare';
import { MarketHead } from './market-head';
import { MarketMoves } from './market-moves';
import { MarketSignals } from './market-signals';
import { CHART_PANEL_CLASS, SIDE_PANEL_CLASS, TERMINAL_GRID_CLASS } from './terminal-layout';
import { usePickSpan } from './use-chart-dock';
import { useMarketCompare } from './use-compare';

const NOT_ASKED: readonly Span[] = [];

export function MarketDetail({ market, list }: { readonly market: ListedMarket; readonly list: MarketList }) {
  const signals = useQuery(trpc.views.signals.queryOptions(undefined, { meta: { silent: true } }));
  const own = marketSignals(signals.data?.items ?? [], market.coin);
  const ask = useAskAboutSpan(market.key);
  const compare = useMarketCompare(market.coin, list);
  return (
    <div className="flex flex-col gap-4">
      <MarketHead market={market} />
      <div className={TERMINAL_GRID_CLASS}>
        <div className={CHART_PANEL_CLASS}>
          <AppBoundary tier="panel" scope="market-chart">
            <MarketChart
              market={market}
              topic={market.key}
              asked={NOT_ASKED}
              onAsk={ask}
              indicators
              compare={compare.on ? compare.peers.map((coin) => ({ coin, name: nameOf(list, coin) })) : []}
              className="h-full"
            />
          </AppBoundary>
        </div>
        <div className={SIDE_PANEL_CLASS}>
          <MarketMoves coin={market.coin} />
          <MarketCompareBlock compare={compare} list={list} />
          <MarketSignals market={market} signals={own} />
        </div>
      </div>
    </div>
  );
}

/** Takes the stretch picked to the market's conversation with the question asked about it. */
function useAskAboutSpan(topic: string): (span: Span, text: string) => void {
  const launch = useLaunch();
  const send = useSendMessage();
  const pick = usePickSpan();
  return (span, text) => {
    const requestId = crypto.randomUUID();
    pick(topic, null);
    void launch({
      topic,
      requestId,
      text,
      wait: 'converse',
      request: async () =>
        accepted(
          await send.mutateAsync({
            topic,
            text,
            requestId,
            reviseProposalVersionId: null,
            span,
            timeZone: browserTimeZone(),
          }),
        ).entry.id,
    }).catch(() => undefined);
  };
}
