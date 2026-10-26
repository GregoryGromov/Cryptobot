import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { type ReactNode, useId } from 'react';
import { match } from 'ts-pattern';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import type { BookView } from '../domain/book-vm';

export const PANEL_CLASS = cn(cardVariants({ size: 'sm' }), 'min-w-0 gap-1.5 px-4');
export const PANEL_HEAD_CLASS = 'flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1';
export const PANEL_TITLE_CLASS = 'font-medium text-foreground text-meta';
export const FACT_CLASS = 'flex items-baseline justify-between gap-4 py-1';

function Fact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className={FACT_CLASS}>
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap text-end font-figure">{children}</dd>
    </div>
  );
}

function Signed({ value }: { readonly value: number }) {
  const fmt = useFormatters();
  return (
    <Numeral tone="direction" direction={directionOf(value, 2)}>
      {fmt.usdSigned(value)}
    </Numeral>
  );
}

function CycleResult({ value }: { readonly value: BookView['value'] }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  return match(value)
    .with({ kind: 'valued' }, ({ nav, returnPct }) => (
      <>
        <Fact label={t('stats.endNav')}>{fmt.usd(nav)}</Fact>
        {returnPct !== null && (
          <Fact label={t('stats.return')}>
            <Numeral tone="direction" direction={directionOf(returnPct, 2)}>
              {fmt.change(returnPct, 2)}
            </Numeral>
          </Fact>
        )}
      </>
    ))
    .with({ kind: 'awaiting' }, () => null)
    .exhaustive();
}

export function BookFacts({ view }: { readonly view: BookView }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  const id = useId();
  const stamp = match(view.value)
    .with({ kind: 'valued' }, ({ asOf }) =>
      asOf === null ? t('value.fresh') : t('value.asOf', { time: fmt.dateTime(asOf) }),
    )
    .with({ kind: 'awaiting' }, () => t('value.awaiting'))
    .exhaustive();
  return (
    <section aria-labelledby={id} className={PANEL_CLASS}>
      <div className={PANEL_HEAD_CLASS}>
        <h2 id={id} className={PANEL_TITLE_CLASS}>
          {t(`books.${view.key}.label`)}
        </h2>
        <span className="text-meta text-muted-foreground">{stamp}</span>
      </div>
      <dl aria-label={t('stats.label')} className="flex flex-col text-meta">
        {match(view.period)
          .with({ kind: 'ended' }, () => <CycleResult value={view.value} />)
          .with({ kind: 'current' }, () => null)
          .exhaustive()}
        <Fact label={t('stats.realized')}>
          <Signed value={view.realized} />
        </Fact>
        {match(view.period)
          .with({ kind: 'current' }, ({ unrealized }) => (
            <Fact label={t('stats.unrealized')}>
              {unrealized === null ? (
                <span className="text-muted-foreground">{t('stats.unvalued')}</span>
              ) : (
                <Signed value={unrealized} />
              )}
            </Fact>
          ))
          .with({ kind: 'ended' }, () => null)
          .exhaustive()}
        <Fact label={t('stats.fees')}>{fmt.usd(view.fees)}</Fact>
        <Fact label={t('stats.drawdown')}>{fmt.percent(view.maxDrawdownPct, 1)}</Fact>
        <Fact label={t('stats.wins')}>
          {view.closedCount > 0 ? (
            t('stats.winsOf', { wins: view.wins, count: view.closedCount })
          ) : (
            <span className="text-muted-foreground">{t('stats.noneClosed')}</span>
          )}
        </Fact>
      </dl>
    </section>
  );
}
