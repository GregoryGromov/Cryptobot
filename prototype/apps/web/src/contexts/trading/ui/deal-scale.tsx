import type { Estimate } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { type DealLevels, scaleOffset } from '../domain/deal-phase';

const percentOf = (fraction: number): string => `${fraction * 100}%`;

const labelClass = 'font-medium text-[0.6875rem] text-muted-foreground uppercase tracking-[0.08em]';

function Level({
  label,
  price,
  align,
  children,
}: {
  readonly label: string;
  readonly price: string;
  readonly align: 'start' | 'center' | 'end';
  readonly children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'flex flex-col gap-1',
        align === 'start' && 'items-start',
        align === 'center' && 'items-center text-center',
        align === 'end' && 'items-end text-end',
      )}
    >
      <span className={labelClass}>{label}</span>
      <Numeral weight="semibold" className="text-row">
        {price}
      </Numeral>
      {children}
    </span>
  );
}

export function DealScale({
  levels,
  estimate,
  settled,
}: {
  readonly levels: DealLevels;
  readonly estimate: Estimate | null;
  readonly settled: boolean;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const entry = scaleOffset(levels, levels.entry);
  const prices = {
    stop: fmt.price(levels.stop),
    entry: fmt.price(levels.entry),
    take: fmt.price(levels.take),
  };
  const label =
    levels.now === null
      ? t('deal.scale', prices)
      : t('deal.scaleNow', { ...prices, now: fmt.price(levels.now) });
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={label} className="relative mx-2 h-1">
        <span
          className="absolute inset-y-0 start-0 rounded-s-full bg-linear-to-r from-down/75 to-down/15"
          style={{ width: percentOf(entry) }}
        />
        <span
          className="absolute inset-y-0 end-0 rounded-e-full bg-linear-to-r from-up/15 to-up/75"
          style={{ width: percentOf(1 - entry) }}
        />
        <span
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-foreground/80 bg-card ring-4 ring-foreground/8"
          style={{ left: percentOf(entry) }}
        />
        {levels.now !== null && (
          <span
            className={cn(
              'absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card',
              settled ? 'bg-muted-foreground' : 'bg-foreground',
            )}
            style={{ left: percentOf(scaleOffset(levels, levels.now)) }}
          />
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-meta">
        <Level label={t('levels.stop')} price={prices.stop} align="start">
          {estimate !== null && (
            <span className="rounded-full bg-down/12 px-1.5 font-figure font-medium text-down text-xs leading-5">
              <span className="sr-only">
                {t('deal.lossAtStop', { amount: fmt.usdSigned(-estimate.lossAtStop) })}
              </span>
              <span aria-hidden>{fmt.usdSigned(-estimate.lossAtStop)}</span>
            </span>
          )}
        </Level>
        <Level label={t('levels.entry')} price={prices.entry} align="center">
          {levels.now !== null && (
            <Numeral tone="muted" className="text-xs">
              {t(settled ? 'levelAt.exit' : 'levelAt.now', { price: fmt.price(levels.now) })}
            </Numeral>
          )}
        </Level>
        <Level label={t('levels.take')} price={prices.take} align="end">
          {estimate !== null && (
            <span className="rounded-full bg-up/12 px-1.5 font-figure font-medium text-up text-xs leading-5">
              <span className="sr-only">
                {t('deal.gainAtTake', { amount: fmt.usdSigned(estimate.gainAtTake) })}
              </span>
              <span aria-hidden>{fmt.usdSigned(estimate.gainAtTake)}</span>
            </span>
          )}
        </Level>
      </div>
    </div>
  );
}
