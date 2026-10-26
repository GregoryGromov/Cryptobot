import type { LiveSignal, SignalRow } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { disclosureChevronClass } from '@reinforce/ui-primitives/collapsible';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { match } from 'ts-pattern';
import { onTerm, planHorizonOf } from '~/contexts/forecast/domain/episode-vm';
import { agoWords, forecastCheckWords, horizonWords, leanWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { useTradingMode } from '~/shared/api/trading-mode';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';
import { Reveal } from '~/shared/ui/reveal';
import { useOpenSignal } from '../api/use-open-signal';
import { freshEarlier, isFresh, sinceOf, wavesOf } from '../domain/waves';
import { QuietSignals, SignalNote } from './quiet-signals';
import { TickingLife } from './signal-life';
import { SignalRows } from './signal-rows';
import { SignalSpark } from './signal-spark';
import { factsWords, signalDirectionClass } from './signal-words';

type Live = Extract<LiveSignal, { kind: 'signal' }>;

const NOW_TICK_MS = 15_000;

export function LiveSignalMessage({
  live,
  earlier,
}: {
  readonly live: LiveSignal;
  readonly earlier: readonly SignalRow[];
}) {
  const now = useServerNow(NOW_TICK_MS);
  return match(live)
    .with({ kind: 'quiet' }, (quiet) => <QuietSignals quiet={quiet} />)
    .with({ kind: 'signal' }, (signal) =>
      isFresh(signal, now) ? (
        <FreshSignal live={signal} earlier={freshEarlier(signal, earlier, now)} now={now} />
      ) : (
        <NoFreshSignal last={signal.eventAt} now={now} />
      ),
    )
    .exhaustive();
}

function FreshSignal({
  live,
  earlier,
  now,
}: {
  readonly live: Live;
  readonly earlier: readonly SignalRow[];
  readonly now: number;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const open = useOpenSignal();
  const earlierId = useId();
  const [showEarlier, setShowEarlier] = useState(false);
  const since = sinceOf(live, now);
  const folded = wavesOf(earlier).length;
  return (
    <div className="flex flex-col gap-2">
      {folded > 0 && (
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showEarlier}
            aria-controls={earlierId}
            onClick={() => setShowEarlier(!showEarlier)}
            className="self-start"
          >
            {showEarlier ? t('earlier.hide') : t('earlier.show', { count: folded })}
            <ChevronDown aria-hidden className={disclosureChevronClass} />
          </Button>
          <Reveal open={showEarlier} id={earlierId}>
            <SignalRows items={earlier} onOpen={open} />
          </Reveal>
        </div>
      )}
      <section aria-label={t('label')} className={cn(cardVariants({ size: 'sm' }), 'gap-3 px-4')}>
        <div className="flex items-center gap-3">
          <CoinLogo coin={live.coin} ticker={live.ticker} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-foreground text-row">
              <Trans
                t={t}
                i18nKey="named"
                values={{
                  name: live.name,
                  head: t(`head.${live.direction}`),
                  change: fmt.move(live.move),
                  horizon: horizonWords(format, live.horizon),
                }}
                components={{
                  b: <b className="font-semibold" />,
                  move: (
                    <span className={cn('font-figure font-medium', signalDirectionClass(live.direction))} />
                  ),
                }}
              />
            </p>
            <p className="text-meta text-muted-foreground">
              {[agoWords(format, fmt.duration, live.eventAt, now), ...factsWords(live, t, format)].join(
                ' · ',
              )}
              {since !== null && (
                <>
                  {' · '}
                  <Trans
                    t={t}
                    i18nKey="since"
                    values={{ change: fmt.change(since, 2) }}
                    components={{
                      move: <span className={cn('font-figure', directionClass(directionOf(since, 2)))} />,
                    }}
                  />
                </>
              )}
              {' · '}
              <TickingLife signal={live} />
            </p>
          </div>
          {live.spark && <SignalSpark spark={live.spark} direction={live.direction} size="card" />}
        </div>
        {live.view ? (
          <Reading live={live} view={live.view} now={now} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => open(live)}>
              {live.asked ? t('openReading') : t('analyze')}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/signals">{t('all')}</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Reading({
  live,
  view,
  now,
}: {
  readonly live: Live;
  readonly view: NonNullable<Live['view']>;
  readonly now: number;
}) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const h = planHorizonOf(onTerm(view.forecast, useTradingMode().horizon));
  return (
    <div className="flex flex-col gap-2 border-foreground/7 border-t pt-3">
      <p className="text-foreground text-sm">{view.text}</p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {h && (
          <p className="text-meta">
            <span className="font-medium text-foreground">
              {t('verdict', { lean: leanWords(format, h.probs), horizon: horizonWords(format, h.horizon) })}
            </span>
            <span className="text-muted-foreground">
              {' · '}
              {forecastCheckWords(format, fmt.duration, { status: h.checkStatus, checkAt: h.checkAt }, now)}
            </span>
          </p>
        )}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/m/$market"
              params={{ market: live.chat }}
              search={live.threadId === null ? {} : { idea: live.threadId }}
            >
              {t('more')}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/signals">{t('all')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoFreshSignal({ last, now }: { readonly last: number; readonly now: number }) {
  const { t } = useT('signals');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  return (
    <SignalNote
      title={t('none.fresh')}
      note={t('none.since', { ago: agoWords(format, fmt.duration, last, now) })}
    >
      <Button variant="ghost" size="sm" asChild className="-ml-3.5 self-start">
        <Link to="/signals">{t('all')}</Link>
      </Button>
    </SignalNote>
  );
}
