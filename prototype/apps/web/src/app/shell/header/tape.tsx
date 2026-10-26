import { Button } from '@reinforce/ui-react/button';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useRef, useState } from 'react';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { freshCoinsOf, type TapeQuote, tapeCopiesOf, tapeQuotesOf } from '../domain/tape';
import { useShellActions, useTapeHidden } from '../shell-store';
import { useMarquee } from './use-marquee';

const PACE_MS = 7_000;

const COPIES = ['first', 'second', 'third', 'fourth'] as const;

const TWIN_WIDTHS = ['w-28', 'w-32', 'w-24', 'w-36', 'w-20'] as const;

/** The market tape inside the head bar: its toggle, then the running quotes unless the person hid them. */
export function TapeStrip({ className }: { readonly className?: string }) {
  const { t } = useT('shell');
  const hidden = useTapeHidden();
  const [shownByHand] = useState(hidden);
  const { tapeToggled } = useShellActions();
  return (
    <section
      aria-label={t('tape.label')}
      className={cn('flex h-full min-w-0 items-center', !hidden && 'flex-1', className)}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={tapeToggled}
        aria-label={hidden ? t('tape.show') : t('tape.hide')}
        className="shrink-0 rounded-full text-muted-foreground"
      >
        {hidden ? <Eye strokeWidth={1.75} /> : <EyeOff strokeWidth={1.75} />}
      </Button>
      {!hidden && (
        <AppBoundary tier="panel" scope="tape" fallback={() => <div className="flex-1" />}>
          <TapeQuotes fade={shownByHand} />
        </AppBoundary>
      )}
    </section>
  );
}

// The run fades in when the person shows it; on a page change it comes with the rest of the bar.
function TapeQuotes({ fade }: { readonly fade: boolean }) {
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const signals = useQuery(trpc.views.signals.queryOptions());
  const now = useServerNow(30_000);
  if (!catalog.data) return catalog.isError ? <div className="flex-1" /> : <TapeTwin />;
  const quotes = tapeQuotesOf(catalog.data);
  if (quotes.length < 2) return <div className="flex-1" />;
  return <TapeRun quotes={quotes} fresh={freshCoinsOf(signals.data?.items ?? [], now)} fade={fade} />;
}

function TapeRun({
  quotes,
  fresh,
  fade,
}: {
  readonly quotes: readonly TapeQuote[];
  readonly fresh: ReadonlySet<string>;
  readonly fade: boolean;
}) {
  const run = useRef<HTMLDivElement>(null);
  const copies = tapeCopiesOf(quotes.length);
  useMarquee(run, { copies, durationMs: quotes.length * PACE_MS });
  return (
    <div
      className={cn(
        'mask-x-from-92% h-full min-w-0 flex-1 overflow-hidden',
        fade && 'motion-safe:fade-in motion-safe:animate-in motion-safe:duration-500',
      )}
    >
      <div ref={run} className="flex h-full w-max">
        {COPIES.slice(0, copies).map((copy, index) => (
          <div key={copy} className="flex shrink-0" aria-hidden={index > 0 || undefined} inert={index > 0}>
            {quotes.map((quote) => (
              <TapeItem key={quote.coin} quote={quote} fresh={fresh.has(quote.coin)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TapeItem({ quote, fresh }: { readonly quote: TapeQuote; readonly fresh: boolean }) {
  const { t } = useT('shell');
  const fmt = useFormatters();
  return (
    <Link
      {...topicLink(quote.key)}
      className="focus-ring hover-neutral-soft flex h-full items-center gap-2 whitespace-nowrap px-3.5 text-foreground-soft text-meta transition-colors"
    >
      <CoinLogo coin={quote.coin} ticker={quote.ticker} size="sm" className="size-4" />
      <span className="font-medium text-foreground">{quote.name}</span>
      <Numeral>{fmt.price(quote.price)}</Numeral>
      {quote.change1h !== null && (
        <Numeral tone="direction" direction={directionOf(quote.change1h, 2)}>
          {fmt.change(quote.change1h, 2)}
        </Numeral>
      )}
      {fresh && (
        <>
          <Zap aria-hidden strokeWidth={2} className="size-3.5 fill-current text-foreground" />
          <span className="sr-only">{t('tape.fresh')}</span>
        </>
      )}
    </Link>
  );
}

function TapeTwin() {
  return (
    <div
      aria-hidden
      className="mask-x-from-92% flex h-full min-w-0 flex-1 items-center gap-7 overflow-hidden px-3.5"
    >
      {TWIN_WIDTHS.map((width) => (
        <span key={width} className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className={cn('h-2.5 rounded-full', width)} />
        </span>
      ))}
    </div>
  );
}
