import type { Cls, ForecastNote, HorizonNote } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { match } from 'ts-pattern';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { directionClass } from '~/shared/ui/direction-class';
import { type HorizonDetail, horizonDetail } from '../domain/horizon-vm';
import { checkWords, horizonWords, leanOf } from '../domain/verdict';
import { OddsTicks } from './odds-ticks';

export function HorizonDetails({
  forecast,
  horizon,
  now,
}: {
  readonly forecast: ForecastNote;
  readonly horizon: HorizonNote;
  readonly now: number;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const titleId = useId();
  const detail = horizonDetail(forecast, horizon, now);
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5 pt-3 pb-1">
      <p id={titleId} className="sr-only">
        {t('horizon.title', {
          term: horizonWords(format, detail.horizon),
          time: fmt.clock(detail.checkAt),
        })}
      </p>
      <OddsTicks
        outcomes={detail.outcomes}
        label={t('horizon.outcomes')}
        flat={t('horizon.flat', { band: fmt.percent(horizon.tau, 1) })}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Result detail={detail} lean={leanOf(horizon.probs)?.cls ?? null} />
        {detail.expected && (
          <p className="text-meta text-muted-foreground">
            <Trans
              t={t}
              i18nKey="horizon.expect"
              values={{ price: fmt.price(detail.expected.price) }}
              components={{ b: <b className="font-figure font-medium text-foreground" /> }}
            />
          </p>
        )}
      </div>
      {detail.traded && forecast.horizons.length > 1 && (
        <p className="text-meta text-muted-foreground">{t('horizon.trade')}</p>
      )}
      {detail.note && <p className="text-foreground-soft text-sm">{detail.note}</p>}
    </section>
  );
}

function Result({ detail, lean }: { readonly detail: HorizonDetail; readonly lean: Cls | null }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  return match(detail.status)
    .with({ kind: 'checked' }, (s) => (
      <p className="text-foreground text-sm">
        <Trans
          t={t}
          i18nKey="horizon.result"
          values={{ change: fmt.change(s.returnPct, 2), verdict: checkWords(format, lean, s.outcome) }}
          components={{
            move: <span className={cn('font-figure', directionClass(directionOf(s.returnPct, 2)))} />,
          }}
        />
      </p>
    ))
    .with({ kind: 'waiting' }, (s) => (
      <p className="text-meta text-muted-foreground">{t('horizon.waiting', { time: fmt.clock(s.at) })}</p>
    ))
    .with({ kind: 'checking' }, (s) => (
      <p className="text-meta text-muted-foreground">{t('horizon.checking', { time: fmt.clock(s.at) })}</p>
    ))
    .with({ kind: 'no-prices' }, () => (
      <p className="text-meta text-muted-foreground">{format('check.noPrices')}</p>
    ))
    .with({ kind: 'unscored' }, () => (
      <p className="text-meta text-muted-foreground">{format('check.notProspective')}</p>
    ))
    .exhaustive();
}
