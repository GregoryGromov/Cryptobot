import type { Pulse } from '@reinforce/server/dto';
import { hashKey, type QueryClient, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { trpc } from './trpc';

const PULSE_MS = 2_000;

const pulseQueryOptions = () =>
  trpc.views.pulse.queryOptions(undefined, {
    refetchInterval: PULSE_MS,
    staleTime: 0,
    meta: { silent: true },
  });

export const usePulse = () => useQuery(pulseQueryOptions());

const changedTopics = (before: Pulse['conversations'], after: Pulse['conversations']): string[] =>
  Object.keys(after).filter((topic) => before[topic] !== after[topic]);

export const invalidationsFor = (before: Pulse, after: Pulse) => ({
  account: before.accountId !== null && before.accountId !== after.accountId,
  // A visitor's first act makes them a guest: what they see is theirs already and only needs asking again.
  joined: before.accountId === null && after.accountId !== null,
  market: before.market.lastBarEnd !== after.market.lastBarEnd || before.market.phase !== after.market.phase,
  topics: changedTopics(before.conversations, after.conversations),
  telegram: before.telegramLinkId !== after.telegramLinkId,
});

const marketViews = () => [
  trpc.views.session.pathFilter(),
  trpc.views.chats.pathFilter(),
  trpc.views.chat.pathFilter(),
  trpc.views.signals.pathFilter(),
  trpc.views.catalog.pathFilter(),
  trpc.views.portfolio.pathFilter(),
  trpc.views.broker.pathFilter(),
  trpc.views.journal.pathFilter(),
  trpc.views.threadChart.pathFilter(),
  trpc.views.tradeChart.pathFilter(),
  trpc.views.candles.pathFilter(),
];

const conversationViews = (topics: readonly string[]) => [
  ...topics.map((topic) => trpc.views.chat.queryFilter({ topic })),
  trpc.views.chats.pathFilter(),
  trpc.views.signals.pathFilter(),
  trpc.views.session.pathFilter(),
  trpc.views.portfolio.pathFilter(),
  trpc.views.broker.pathFilter(),
  trpc.views.journal.pathFilter(),
];

export const installLiveInvalidation = (client: QueryClient): (() => void) => {
  const pulseHash = hashKey(trpc.views.pulse.queryKey());
  let last: Pulse | undefined;
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    if (event.query.queryHash !== pulseHash) return;
    const next = event.query.state.data as Pulse;
    const before = last;
    last = next;
    if (!before) return;
    const change = invalidationsFor(before, next);
    const others = { predicate: (query: { readonly queryHash: string }) => query.queryHash !== pulseHash };
    if (change.account) {
      void client.resetQueries(others);
      return;
    }
    if (change.joined) {
      void client.invalidateQueries(others);
      return;
    }
    const filters = [
      ...(change.market ? marketViews() : []),
      ...(change.topics.length ? conversationViews(change.topics) : []),
      ...(change.telegram ? [trpc.views.session.pathFilter()] : []),
    ];
    for (const filter of filters) void client.invalidateQueries(filter);
  });
};

export const useServerSkew = (): number => {
  const { data, dataUpdatedAt } = usePulse();
  return data ? data.now - dataUpdatedAt : 0;
};

export const useServerNow = (tickMs = 1_000): number => {
  const skew = useServerSkew();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  return now + skew;
};
