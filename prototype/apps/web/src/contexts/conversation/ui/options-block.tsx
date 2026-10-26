import type { AssetClass } from '@reinforce/server/dto';
import { sparkPath } from '@reinforce/ui-primitives/charts';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { accepted } from '~/shared/api/rejection';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { useLaunch } from '../api/launch';
import { useAnalyzeMarket, useWatchMarkets } from '../api/mutations';
import type { MessageOption } from '../domain/chat-types';
import { chipRowClass } from './feed-classes';

const SPARK = { width: 64, height: 24, pad: 2 } as const;

type Glance = NonNullable<MessageOption['glance']>;

function GlanceRow({ glance }: { readonly glance: Glance }) {
  const f = useFormatters();
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-meta text-muted-foreground">
          {glance.markets.map((market, index) => (
            <Fragment key={market.name}>
              {index > 0 && ' · '}
              {market.name}{' '}
              {market.change1h === null ? (
                '—'
              ) : (
                <Numeral tone="direction" direction={directionOf(market.change1h, 1)}>
                  {f.change(market.change1h, 1)}
                </Numeral>
              )}
            </Fragment>
          ))}
        </span>
      </span>
      <svg
        aria-hidden
        viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
        className={cn('h-6 w-16 shrink-0 fill-none', glance.up ? 'stroke-up' : 'stroke-down')}
      >
        <path d={sparkPath(glance.spark, SPARK)} strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    </>
  );
}

export function OptionsBlock({ options }: { readonly options: readonly MessageOption[] }) {
  const { t } = useT('conversation');
  const analyze = useAnalyzeMarket();
  const watch = useWatchMarkets();
  const queryClient = useQueryClient();
  const launch = useLaunch();
  const [picked, setPicked] = useState<string | null>(null);
  const busy = analyze.isPending || watch.isPending || picked !== null;
  const watchClasses = async (classes: readonly AssetClass[]) => {
    const catalog = await queryClient.fetchQuery(trpc.views.catalog.queryOptions());
    const markets = catalog
      .filter((group) => classes.includes(group.cls))
      .flatMap((group) => group.markets.map((market) => market.key));
    await watch.mutateAsync({ kind: 'watch', markets, on: true });
  };
  const act = (option: MessageOption): Promise<unknown> => {
    const chat = option.chat;
    if (chat === null) return watchClasses(option.classes ?? []);
    const requestId = crypto.randomUUID();
    return launch({
      topic: chat,
      requestId,
      text: option.text || null,
      wait: 'forecast',
      request: async () =>
        accepted(await analyze.mutateAsync({ requestId, instrument: chat, text: option.text })).dispatch.id,
    });
  };
  const pick = (option: MessageOption) => {
    setPicked(option.label);
    void act(option)
      .catch(() => undefined)
      .finally(() => setPicked(null));
  };
  const glance = options.some((option) => option.glance !== null);
  return (
    <fieldset
      aria-label={t('feed.quick')}
      className={cn(
        glance ? 'glass flex w-full max-w-[40rem] flex-col gap-0.5 rounded-2xl p-1.5' : chipRowClass,
      )}
    >
      {options.map((option) =>
        option.glance ? (
          <button
            key={option.label}
            type="button"
            disabled={busy}
            aria-busy={picked === option.label || undefined}
            onClick={() => pick(option)}
            className="focus-ring disabled-state hover-neutral-soft flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors"
          >
            <span className="w-28 shrink-0 font-semibold text-row">{option.label}</span>
            <GlanceRow glance={option.glance} />
          </button>
        ) : (
          <Button
            key={option.label}
            variant="secondary"
            size="sm"
            disabled={busy && picked !== option.label}
            loading={picked === option.label}
            onClick={() => pick(option)}
          >
            {option.label}
          </Button>
        ),
      )}
    </fieldset>
  );
}
