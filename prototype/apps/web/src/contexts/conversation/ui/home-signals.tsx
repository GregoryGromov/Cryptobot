import type { SignalRow, Signals } from '@reinforce/server/dto';
import { sectionCardLinkClass } from '@reinforce/ui-primitives/card';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { match, P } from 'ts-pattern';
import { HourSpark } from '~/contexts/markets/ui/hour-spark';
import { LiveRows } from '~/contexts/signals/ui/live-rows';
import { useServerNow } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';

const TWIN_ROWS = ['a', 'b', 'c'] as const;

type Quiet = NonNullable<Signals['quiet']>;

const NOW_TICK_MS = 30_000;

function MoverRow({ mover }: { readonly mover: Quiet['movers'][number] }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const direction = directionOf(mover.change1h, 2);
  return (
    <Link
      {...topicLink(mover.chat)}
      className="focus-ring flex min-h-12.5 w-full items-center gap-3 rounded-(--radius) bg-foreground/4 py-2.5 ps-2.5 pe-3 font-medium text-foreground text-row transition-colors hover:bg-foreground/8 active:bg-foreground/10 max-sm:pe-2.5"
    >
      <CoinLogo coin={mover.coin} ticker={mover.ticker} size="sm" className="size-5.5" />
      <span className="min-w-0 flex-1 truncate">
        <Trans
          t={t}
          i18nKey="home.move"
          values={{ name: mover.name, change: f.change(mover.change1h, 2) }}
          components={{
            b: <b className="font-semibold" />,
            move: <span className={cn('font-figure', directionClass(direction))} />,
          }}
        />
      </span>
      <HourSpark values={mover.spark} direction={direction} className="shrink-0" />
    </Link>
  );
}

/** No signal for an hour: when the last one came, and the markets that moved most meanwhile, as moves. */
function QuietMoves({ quiet, last }: { readonly quiet: Quiet; readonly last: number | null }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const now = useServerNow(NOW_TICK_MS);
  const note = match({ loading: quiet.loading, last })
    .with({ loading: true }, () => t('home.loading'))
    .with({ last: P.number }, ({ last: at }) => t('home.calm', { span: f.duration(now - at) }))
    .otherwise(() => t('home.quiet', { count: quiet.markets }));
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="muted" className="px-1 text-meta">
        {note}
      </Text>
      {quiet.movers.length > 0 && (
        <ul aria-label={t('home.moves')} className="flex flex-col gap-1.5 max-sm:-mx-2">
          {quiet.movers.map((mover) => (
            <li key={mover.coin}>
              <MoverRow mover={mover} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignalsTwin() {
  const { t } = useT('common');
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-1.5 max-sm:-mx-2">
      <span className="sr-only">{t('loading')}</span>
      {TWIN_ROWS.map((row) => (
        <div
          key={row}
          className="flex h-12.5 items-center gap-3 rounded-(--radius) bg-foreground/4 ps-2.5 pe-3 max-sm:pe-2.5"
        >
          <Skeleton className="size-5.5 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1 rounded-full" />
          <Skeleton className="h-3 w-14 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SignalsList({ onOpen }: { readonly onOpen: (signal: SignalRow) => void }) {
  const { t } = useT('conversation');
  const signals = useQuery(trpc.views.signals.queryOptions());
  return (
    <AsyncView query={signals} errorTitle={t('home.signalsError')} loading={<SignalsTwin />}>
      {(data) =>
        data.quiet ? (
          <QuietMoves
            quiet={data.quiet}
            last={data.items.length > 0 ? Math.max(...data.items.map((item) => item.eventAt)) : null}
          />
        ) : (
          <LiveRows items={data.items} onOpen={onOpen} />
        )
      }
    </AsyncView>
  );
}

export function HomeSignals({ onOpen }: { readonly onOpen: (signal: SignalRow) => void }) {
  const { t } = useT('conversation');
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3 px-1 pb-2">
        <Heading as="h2" size="section" id={heading} className="text-row">
          {t('home.signals')}
        </Heading>
        <Link to="/signals" className={sectionCardLinkClass}>
          {t('home.allSignals')}
          <ChevronRight aria-hidden />
        </Link>
      </div>
      <div className="min-h-41">
        <AppBoundary tier="section" scope="home-signals">
          <SignalsList onOpen={onOpen} />
        </AppBoundary>
      </div>
    </section>
  );
}
