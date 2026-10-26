import type { Chat, ChatMessage, ForecastNote, MarketName } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { AgentCardView } from '~/contexts/agents/ui/agent-card';
import { type ChartAway, EpisodeCard, forecastAnchorId } from '~/contexts/forecast/ui/episode-card';
import type { Span } from '~/contexts/markets/domain/chart-vm';
import { SpanTag } from '~/contexts/markets/ui/span-tag';
import { ChatSignal } from '~/contexts/signals/ui/chat-signal';
import { DealCard } from '~/contexts/trading/ui/deal-card';
import { cardOf } from '~/shared/api/mock/cards';
import { useFormatters } from '~/shared/format/use-formatters';
import { tickerOf } from '~/shared/routing/topics';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { type EntryPart, holdsDeal } from '../domain/feed';
import { brokerText } from '../domain/prompts';
import { BrokerWords } from './broker-words';
import { brokerTextClass, bubbleBodyClass, noteLineClass, userBubbleClass } from './feed-classes';
import { HandoffCards } from './handoff-cards';
import { OptionsBlock } from './options-block';
import { Coded, Speaker, Stamp, stampWords } from './stamp';

export type EntryContext = {
  readonly topic: string;
  /** Opens the market's chart on a stretch a question was about; null where there is no chart. */
  readonly onShowSpan?: ((span: Span) => void) | null;
  readonly market: MarketName | null;
  readonly code: string | null;
  readonly record: Chat['record'];
  readonly openForecast: string | null;
  readonly onToggleForecast: (forecastId: string) => void;
  /** The forecast the conversation's own chart draws, whose card folds its chart away while it does. */
  readonly chartAway?: (ChartAway & { readonly forecastId: string }) | null;
  /** Opens the conversation's own chart on a forecast; null where there is no chart. */
  readonly onOpenChart?: ((forecastId: string) => void) | null;
};

const viaOf = (message: ChatMessage): string | undefined =>
  message.channel === 'telegram' ? 'Telegram' : undefined;

const marketOf = (forecast: ForecastNote, market: MarketName | null): MarketName =>
  market ?? {
    coin: forecast.coin,
    ticker: tickerOf(forecast.coin),
    name: tickerOf(forecast.coin),
    cls: null,
  };

function BrokerMessage({
  message,
  part,
  context,
}: {
  readonly message: ChatMessage;
  readonly part: EntryPart;
  readonly context: EntryContext;
}) {
  const f = useFormatters();
  const card = part !== 'words';
  const words = part !== 'card';
  const forecast = card ? message.forecast : null;
  const signal = card ? message.signal : null;
  const { options, handoff } = words ? message : { options: null, handoff: null };
  const proposal = words && !holdsDeal(message) ? message.proposal : null;
  const text = words ? brokerText(message) : null;
  const agentCard = words ? cardOf(message.key) : undefined;
  return (
    <div className="flex w-full flex-col items-start gap-2">
      {forecast && (
        <div id={forecastAnchorId(forecast.id)} className="w-full scroll-mt-20">
          <AppBoundary tier="panel" scope="forecast">
            <EpisodeCard
              forecast={forecast}
              signal={signal}
              market={marketOf(forecast, context.market)}
              open={context.openForecast === forecast.id}
              onToggle={() => context.onToggleForecast(forecast.id)}
              record={context.record}
              proposal={message.proposal}
              topic={context.topic}
              chartAway={context.chartAway?.forecastId === forecast.id ? context.chartAway : null}
              onOpenChart={context.onOpenChart ? () => context.onOpenChart?.(forecast.id) : null}
            />
          </AppBoundary>
        </div>
      )}
      {!forecast && signal && <ChatSignal signal={signal} />}
      {text !== null && (
        <div className={brokerTextClass} title={stampWords(f.clock, message.at, viaOf(message))}>
          <Speaker who="broker" />
          <BrokerWords text={text} />
        </div>
      )}
      {agentCard && <AgentCardView card={agentCard} />}
      {proposal && (
        <div className="w-full">
          <AppBoundary tier="panel" scope="proposal">
            <DealCard proposal={proposal} marketName={context.market?.name ?? ''} topic={context.topic} />
          </AppBoundary>
        </div>
      )}
      {options && <OptionsBlock options={options} />}
      {handoff && <HandoffCards handoff={handoff} />}
    </div>
  );
}

export function MessageEntry({
  message,
  part = 'whole',
  context,
}: {
  readonly message: ChatMessage;
  readonly part?: EntryPart;
  readonly context: EntryContext;
}) {
  return match(message.role)
    .with('system', () => <p className={noteLineClass}>{message.text}</p>)
    .with('user', () => (
      <>
        {message.span && (
          <SpanTag
            span={message.span}
            className="mb-1.5"
            {...(context.onShowSpan && { onShow: () => message.span && context.onShowSpan?.(message.span) })}
          />
        )}
        <div className={userBubbleClass}>
          <p className={bubbleBodyClass}>
            <Speaker who="user" />
            <Coded text={message.text.trimEnd()} code={context.code} />
            <Stamp at={message.at} via={viaOf(message)} />
          </p>
        </div>
      </>
    ))
    .with('broker', () => <BrokerMessage message={message} part={part} context={context} />)
    .exhaustive();
}
