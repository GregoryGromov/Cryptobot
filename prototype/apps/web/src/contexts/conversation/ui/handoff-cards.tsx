import type { ChatMessage, Quote } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ChartSpline, MessageCircle } from 'lucide-react';
import { browserTimeZone } from '~/contexts/settings/domain/quiet-hours';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { useLaunch } from '../api/launch';
import { useAnalyzeMarket, useSendMessage } from '../api/mutations';
import { useClosedUntil } from './use-closed-until';

type Handoff = NonNullable<ChatMessage['handoff']>;

function HandoffCard({ quote, question }: { readonly quote: Quote; readonly question: string | null }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const launch = useLaunch();
  const analyze = useAnalyzeMarket();
  const send = useSendMessage();
  const closed = useClosedUntil(quote.coin);
  // A shut exchange has nothing to analyse: the question goes to the market's conversation as words.
  const words = closed !== null ? question : null;
  const go = () => {
    const requestId = crypto.randomUUID();
    void launch(
      words !== null
        ? {
            topic: quote.coin,
            requestId,
            text: words,
            wait: 'converse',
            request: async () =>
              accepted(
                await send.mutateAsync({
                  topic: quote.coin,
                  text: words,
                  requestId,
                  reviseProposalVersionId: null,
                  timeZone: browserTimeZone(),
                }),
              ).entry.id,
          }
        : {
            topic: quote.coin,
            requestId,
            text: question,
            wait: 'forecast',
            request: async () =>
              accepted(await analyze.mutateAsync({ requestId, instrument: quote.coin, text: question ?? '' }))
                .dispatch.id,
          },
    ).catch(() => undefined);
  };
  return (
    <div className="glass flex w-full items-center gap-3 rounded-2xl py-2 ps-3 pe-2">
      <CoinLogo coin={quote.coin} ticker={quote.ticker} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-sm">{quote.name}</span>
        <span className="flex items-baseline gap-1.5 text-meta">
          <Numeral tone="foreground">{quote.price === null ? '—' : f.price(quote.price)}</Numeral>
          {closed !== null ? (
            <span className="truncate text-muted-foreground">{t('head.closed')}</span>
          ) : (
            quote.change1h !== null && (
              <Numeral tone="direction" direction={directionOf(quote.change1h, 2)}>
                {f.change(quote.change1h, 2)}
              </Numeral>
            )
          )}
        </span>
      </div>
      {(closed === null || words !== null) && (
        <Button variant="secondary" size="sm" className="shrink-0" onClick={go}>
          {words !== null ? <MessageCircle aria-hidden /> : <ChartSpline aria-hidden />}
          {words !== null ? t('handoff.ask') : t('handoff.analyze')}
        </Button>
      )}
      <Button asChild variant="ghost" size="icon-sm" className="shrink-0 rounded-full">
        <Link {...topicLink(quote.coin)} aria-label={t('handoff.open', { name: quote.name })}>
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

/** The markets an answer in the general conversation is about, to go on with in their own conversations. */
export function HandoffCards({ handoff }: { readonly handoff: Handoff }) {
  const { t } = useT('conversation');
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const markets = catalog.data?.flatMap((group) => group.markets) ?? [];
  const quotes = handoff.markets.flatMap((coin) => markets.find((market) => market.coin === coin) ?? []);
  if (quotes.length === 0) return null;
  return (
    <ul aria-label={t('handoff.label')} className="flex w-full max-w-[min(100%,40rem)] flex-col gap-2">
      {quotes.map((quote) => (
        <li key={quote.coin}>
          <HandoffCard quote={quote} question={handoff.question} />
        </li>
      ))}
    </ul>
  );
}
