import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment, type ReactNode } from 'react';
import { match } from 'ts-pattern';
import { trpc } from '~/shared/api/trpc';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { type Atom, wordBlocks, wordGroups } from '../domain/broker-words';

type Market = { readonly coin: string; readonly key: string };

const enterClass =
  'motion-safe:fade-in motion-safe:animate-in motion-safe:blur-in-xs motion-safe:duration-300';

const MOVE = { up: 'text-up', down: 'text-down' } as const;

const pointClass =
  "relative ps-4 before:absolute before:start-1 before:top-[0.72em] before:size-1.5 before:rounded-full before:bg-foreground/35 before:content-['']";

function useTickerMarkets(): ReadonlyMap<string, Market> {
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const markets = new Map<string, Market>();
  for (const market of catalog.data?.flatMap((group) => group.markets) ?? []) {
    const known = markets.get(market.ticker);
    // A ticker on several venues means the main one, then the first listed.
    if (!known || (known.coin.includes(':') && !market.coin.includes(':')))
      markets.set(market.ticker, { coin: market.coin, key: market.key });
  }
  return markets;
}

function Ticker({
  ticker,
  market,
  live,
}: {
  readonly ticker: string;
  readonly market: Market | undefined;
  readonly live: boolean;
}) {
  if (!market) return <span className="font-semibold text-foreground">{ticker}</span>;
  const body = (
    <>
      <CoinLogo coin={market.coin} ticker={ticker} size="sm" className="size-[1.2em] self-center" />
      {ticker}
    </>
  );
  const chipClass = 'inline-flex items-baseline gap-1 whitespace-nowrap font-semibold text-foreground';
  if (!live) return <span className={chipClass}>{body}</span>;
  return (
    <Link
      {...topicLink(market.key)}
      className={cn(chipClass, 'focus-ring rounded-sm underline-offset-2 hover:underline')}
    >
      {body}
    </Link>
  );
}

/**
 * The broker's words as he wrote them: paragraphs and points, tickers with their logo, moves in their colour.
 * `shown` counts atoms for an answer being written; `live` makes tickers links to their market.
 */
export function BrokerWords({
  text,
  shown,
  live = true,
}: {
  readonly text: string;
  readonly shown?: number;
  readonly live?: boolean;
}) {
  const markets = useTickerMarkets();
  const writing = shown !== undefined;
  const groups = wordGroups(wordBlocks(text), shown);
  const render = (atom: Atom, index: number): ReactNode => (
    <span key={index} className={cn(atom.strong && 'font-semibold text-foreground', writing && enterClass)}>
      {match(atom)
        .with({ kind: 'word' }, ({ text: word }) => word)
        .with({ kind: 'ticker' }, ({ ticker, tail }) => (
          <>
            <Ticker ticker={ticker} market={markets.get(ticker)} live={live} />
            {tail}
          </>
        ))
        .with({ kind: 'move' }, ({ text: move, direction, tail }) => (
          <>
            <span className={cn('whitespace-nowrap font-figure font-medium', MOVE[direction])}>{move}</span>
            {tail}
          </>
        ))
        .exhaustive()}
    </span>
  );
  return (
    <div className="wrap-anywhere flex flex-col gap-2.5">
      {groups.map((group, index) =>
        match(group)
          .with({ kind: 'paragraph' }, ({ lines }) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the words only grow at the end
            <p key={index}>
              {lines.map((line, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the words only grow at the end
                <Fragment key={at}>
                  {at > 0 && <br />}
                  {line.map(render)}
                </Fragment>
              ))}
            </p>
          ))
          .with({ kind: 'list' }, ({ points }) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the words only grow at the end
            <ul key={index} className="flex flex-col gap-1.5">
              {points.map((point, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the words only grow at the end
                <li key={at} className={pointClass}>
                  {point.map(render)}
                </li>
              ))}
            </ul>
          ))
          .exhaustive(),
      )}
    </div>
  );
}
