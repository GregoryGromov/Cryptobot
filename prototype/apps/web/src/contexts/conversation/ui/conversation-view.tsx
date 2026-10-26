import type { Chat } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { CandlestickChart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { forecastAnchorId } from '~/contexts/forecast/ui/episode-card';
import { useChartForecast } from '~/contexts/forecast/ui/use-forecast-drawing';
import type { Span } from '~/contexts/markets/domain/chart-vm';
import { ChartSheet } from '~/contexts/markets/ui/chart-sheet';
import { MarketChart } from '~/contexts/markets/ui/market-chart';
import { SpanTag, useSpanAsks } from '~/contexts/markets/ui/span-tag';
import { useChartDock, usePickedSpan, usePickSpan } from '~/contexts/markets/ui/use-chart-dock';
import { AgentDock, agentDockRoomClass } from '~/contexts/agents/ui/agent-dock';
import { TradeTicket, tradeDockRoomClass } from '~/contexts/trading/ui/trade-ticket';
import { useTradeTicket } from '~/contexts/trading/ui/use-trade-ticket';
import { useServerNow } from '~/shared/api/live';
import { agentOfTopic } from '~/shared/api/mock/agents';
import { useArrival } from '~/shared/hooks/use-arrival';
import { useMediaQuery } from '~/shared/hooks/use-media-query';
import { useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { assetCode } from '~/shared/routing/topics';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { useConversationStream, useMarkRead } from '../api/conversation-stream';
import { tellOutbox, useOutbox } from '../api/outbox-store';
import { conversationVm, type Laid } from '../domain/conversation-vm';
import { latestForecast, linkedForecast, UNREAD_ANCHOR, unreadAnchor } from '../domain/feed';
import { headView } from '../domain/head-vm';
import type { Hint } from '../domain/prompts';
import { Composer } from './composer';
import { ConversationHead } from './conversation-head';
import { columnClass, floorClass, pageClass } from './feed-classes';
import { FeedList } from './feed-list';
import { Announcer, FirstLook } from './first-look';
import { FollowUps } from './follow-ups';
import { LimitNote } from './limit-note';
import type { EntryContext } from './message-entry';
import { ToEnd } from './to-end';
import { useConversationSay } from './use-conversation-say';
import { useHintWords } from './use-hint-words';
import { useThreadScroll } from './use-thread-scroll';

const DAY_TICK_MS = 60_000;

export function ConversationView({ chat, idea }: { readonly chat: Chat; readonly idea: string | null }) {
  const { t } = useT('conversation');
  const { t: tm } = useT('markets');
  const agent = agentOfTopic(chat.key);
  const roomy = useMediaQuery('(min-width: 80rem)');
  const docked = agent !== undefined && roomy;
  const locale = useLocale();
  const now = useServerNow(DAY_TICK_MS);
  const outbox = useOutbox(chat.key);
  // What already waited while the conversation loaded stands in place rather than entering again.
  const [opened] = useState(
    () =>
      new Set([
        ...chat.items.map((item) => item.key),
        ...outbox.map((said) => said.requestId),
        ...(outbox.length > 0 ? ['wait-lead'] : []),
      ]),
  );
  const [unreadFrom] = useState(() => unreadAnchor(chat));
  const linked = linkedForecast(chat.items, idea);
  const { root, scroller, away, fresh } = useThreadScroll(
    linked ? forecastAnchorId(linked) : unreadFrom ? UNREAD_ANCHOR : null,
  );
  const { draft, analyses } = useConversationStream(chat);
  const [laid, setLaid] = useState<Laid | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const ticket = useTradeTicket();
  const [chartedForecast, setChartedForecast] = useState<string | null>(null);
  const chart = useChartDock();
  const picked = usePickedSpan(chat.key);
  const pick = usePickSpan();
  useMarkRead(chat);
  const say = useConversationSay(chat, (event) => tellOutbox(chat.key, event), scroller);
  const words = useHintWords(chat.market);
  const feed = useRef<HTMLElement>(null);
  useArrival(feed, 'feed');

  const revealed = useRef(linked);
  useEffect(() => {
    if (!linked || linked === revealed.current) return;
    revealed.current = linked;
    const frame = requestAnimationFrame(() => scroller.reveal(forecastAnchorId(linked)));
    return () => cancelAnimationFrame(frame);
  }, [linked, scroller]);

  const vm = conversationVm({
    chat,
    outbox,
    draft,
    laid,
    unreadFrom,
    opened,
    words,
  });
  const market = chat.market;
  const latest = latestForecast(chat.items);
  const charting = chartedForecast ?? latest;
  const forecastNote = chat.items.findLast(
    (item) => item.kind === 'message' && item.forecast?.id === charting,
  );
  const onChart = useChartForecast(
    forecastNote?.kind === 'message' && forecastNote.forecast
      ? { forecast: forecastNote.forecast, signal: forecastNote.signal, proposal: forecastNote.proposal }
      : null,
  );
  const charted = market !== null && chart.open;
  const beside = charted && chart.docked;
  const asked = chat.items.flatMap((item) => (item.kind === 'message' && item.span ? [item.span] : []));
  const showSpan = (span: Span) => {
    pick(chat.key, span);
    chart.setOpen(true);
  };
  const askAbout = (text: string, span: Span) => {
    pick(chat.key, null);
    if (!chart.docked) chart.setOpen(false);
    return say({ requestId: crypto.randomUUID(), text, asset: null, analyze: false, span });
  };
  const openChart = () => {
    if (chart.docked && ticket.docked && ticket.open) ticket.setOpen(false);
    chart.setOpen(true);
  };
  const toggleChart = () => {
    if (chart.open) {
      chart.setOpen(false);
      return;
    }
    setChartedForecast(null);
    openChart();
  };
  const spanAsks: readonly Hint[] = useSpanAsks(chat.key).map((text) => ({ text, analyze: false }));
  const hints = picked && !vm.busy ? spanAsks : vm.hints;
  const context: EntryContext = {
    topic: chat.key,
    market,
    code: market ? assetCode(market.ticker) : null,
    record: chat.record,
    onShowSpan: market ? showSpan : null,
    openForecast: detail,
    onToggleForecast: (id) => {
      if (detail !== id) scroller.hold();
      setDetail(detail === id ? null : id);
    },
    chartAway:
      charted && charting
        ? {
            forecastId: charting,
            where: chart.docked ? 'beside' : 'sheet',
            onReturn: () => chart.setOpen(false),
          }
        : null,
    onOpenChart: market
      ? (forecastId) => {
          setChartedForecast(forecastId);
          openChart();
        }
      : null,
  };

  // An empty conversation's first questions stand by the composer; after an answer they follow it.
  const followUps = (className?: string) => (
    <FollowUps
      key={picked ? 'span' : 'next'}
      hints={hints}
      arriving={picked !== null || outbox.length > 0 || laid !== null}
      className={className}
      onAsk={(hint) =>
        picked
          ? askAbout(hint.text, picked)
          : say({ requestId: crypto.randomUUID(), text: hint.text, asset: null, analyze: hint.analyze })
      }
    />
  );

  return (
    <div
      ref={root}
      className={cn(
        'flex min-h-dvh',
        chat.ticket && ticket.docked && ticket.open && tradeDockRoomClass,
        docked && agentDockRoomClass,
      )}
    >
      <div className={cn(pageClass, 'min-w-0 flex-1')}>
        <ConversationHead
          state={headView(chat)}
          onOpenLatest={
            latest
              ? () => {
                  flushSync(() => setDetail(latest));
                  scroller.reveal(forecastAnchorId(latest));
                }
              : null
          }
          trading={ticket.docked && ticket.open}
          onTrade={() => {
            if (!ticket.open && beside && ticket.docked) chart.setOpen(false);
            ticket.toggle();
          }}
        />
        <div className={cn('flex flex-1', beside && 'gap-6 ps-8 pe-4')}>
          {beside && market && (
            <aside className="sticky top-[4.75rem] flex h-[calc(100svh-5.75rem)] min-w-0 flex-1 self-start">
              <MarketChart
                market={market}
                topic={chat.key}
                asked={asked}
                forecast={onChart}
                onClose={() => chart.setOpen(false)}
                className="flex-1"
              />
            </aside>
          )}
          <div
            className={cn('flex min-w-0 flex-col', beside ? 'w-[29rem] shrink-0 overflow-x-clip' : 'flex-1')}
          >
            <section
              ref={feed}
              aria-label={t('feed.label')}
              data-thread-column=""
              className={cn(columnClass, 'flex-1 px-4 pt-4 pb-6')}
            >
              <FeedList
                vm={vm}
                chat={chat}
                analyses={analyses}
                context={context}
                now={now}
                onLaid={setLaid}
              />
              {vm.firstLook && market && <FirstLook market={market} />}
              {hints.length > 0 && !vm.firstLook && followUps()}
            </section>
            <div
              data-thread-floor=""
              className={cn(floorClass, 'before:end-[calc(-1*var(--thread-dock,0px))]')}
            >
              <div className={cn(columnClass, 'px-3')}>
                {hints.length > 0 && vm.firstLook && followUps('-mx-3 mt-0 mb-3 px-3 md:mx-0 md:px-1')}
                <LimitNote needsLogin={chat.needsLogin} />
                <Composer
                  attachment={picked && <SpanTag span={picked} onClear={() => pick(chat.key, null)} />}
                  placeholder={(asset) => {
                    if (asset) return t('composer.placeholder.asset');
                    if (picked) return tm('chart.placeholder');
                    return market
                      ? t('composer.placeholder.market', { name: inSentence(market.name, locale) })
                      : t('composer.placeholder.none');
                  }}
                  pickTitle={null}
                  tools={
                    market &&
                    !beside && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-pressed={charted}
                        className="aria-pressed:bg-foreground/8 aria-pressed:text-foreground"
                        title={tm('chart.open')}
                        onClick={toggleChart}
                      >
                        <CandlestickChart aria-hidden />
                        <span className="max-sm:sr-only">{tm('chart.open')}</span>
                      </Button>
                    )
                  }
                  above={<ToEnd shown={away} fresh={fresh} onClick={scroller.toEnd} />}
                  onSay={(intent) => {
                    pick(chat.key, null);
                    return say({ ...intent, analyze: false, span: intent.asset ? null : picked });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <Announcer announcement={vm.announcement} marketName={market?.name ?? null} />
      </div>
      {market && !chart.docked && (
        <ChartSheet open={chart.open} onOpenChange={chart.setOpen} title={market.name}>
          <MarketChart
            market={market}
            topic={chat.key}
            asked={asked}
            forecast={onChart}
            className="h-[60svh]"
          />
          {picked && !vm.busy && followUps('mx-0 mt-3 px-0')}
        </ChartSheet>
      )}
      {docked && (
        <AppBoundary tier="panel" scope="agent-dock">
          <AgentDock agent={agent} />
        </AppBoundary>
      )}
      {chat.ticket && (
        <AppBoundary tier="panel" scope="trade-ticket">
          <TradeTicket chat={chat} open={ticket.open} docked={ticket.docked} onOpenChange={ticket.setOpen} />
        </AppBoundary>
      )}
    </div>
  );
}
