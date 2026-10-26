import type { Chat, ForecastNote, MarketName } from '@reinforce/server/dto';
import { SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Link } from '@tanstack/react-router';
import { match, P } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { AsyncView } from '~/shared/ui/async-view';
import { useForecastWhy } from '../api/queries';
import { recordOf } from '../domain/episode-vm';
import { horizonWords, recordWords } from '../domain/verdict';
import { WhyPoints } from './why-points';

export function WhyPanel({
  forecast,
  market,
  crossed,
  onShow,
}: {
  readonly forecast: ForecastNote;
  readonly market: MarketName;
  readonly crossed: boolean;
  readonly onShow: (row: string) => void;
}) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const locale = useLocale();
  const why = useForecastWhy(forecast.id);
  const { invalidation } = forecast;
  return (
    <section aria-label={t('why.label')} className="flex flex-col gap-2.5">
      <AsyncView
        query={why}
        errorTitle={t('why.failed')}
        loading={<PointsSkeleton count={forecast.points.length} />}
      >
        {(data) => <WhyPoints forecast={forecast} why={data} onShow={onShow} />}
      </AsyncView>
      {invalidation && (
        <p className="text-meta text-muted-foreground">
          <Trans
            t={t}
            i18nKey={`why.change.${invalidation.when}`}
            values={{
              name: inSentence(market.name, locale),
              price: fmt.price(invalidation.price),
              level: t(`why.levels.${invalidation.level}`),
            }}
            components={{ b: <b className="font-figure font-medium text-foreground" /> }}
          />
          {crossed && <span className="text-warning"> {t(`why.crossed.${invalidation.when}`)}</span>}
        </p>
      )}
      {why.data && (
        <p
          title={t('why.asOf', { time: fmt.clock(why.data.asOf) })}
          className="text-muted-foreground text-xs sm:hidden"
        >
          {t('doors.snapshot', { time: fmt.clock(why.data.asOf) })}
        </p>
      )}
    </section>
  );
}

export function TradePanel({
  forecast,
  record,
}: {
  readonly forecast: ForecastNote;
  readonly record: Chat['record'];
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const trust = recordOf(record, forecast);
  return (
    <section aria-label={t('doors.trade')} className="flex flex-col gap-3 pt-2.5">
      {match(forecast.plan)
        .with({ action: 'FLAT' }, () => <p className="text-foreground text-sm">{t('why.plan.flat')}</p>)
        .with({ action: P.union('LONG', 'SHORT') }, (plan) => (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label={t('trade.side')}>{format(`side.${plan.action}`)}</Fact>
            <Fact label={t('trade.term')}>{horizonWords(format, plan.horizon)}</Fact>
            <Fact label={t('trade.size')}>{fmt.percent(plan.sizePct, 0)}</Fact>
            <Fact label={t('trade.exit')}>
              <span className="text-down">{fmt.change(-plan.stopPct, 1)}</span>
              <span className="font-normal text-muted-foreground"> {t('trade.or')} </span>
              <span className="text-up">{fmt.change(plan.targetPct, 1)}</span>
            </Fact>
          </dl>
        ))
        .exhaustive()}
      {trust && (
        <p className="text-foreground-soft text-meta">
          {t('why.trust', { term: horizonWords(format, trust.horizon), record: recordWords(format, trust) })}{' '}
          <Link
            to="/portfolio"
            search={{ tab: 'forecasts' }}
            className="link-underline-slide focus-ring rounded-sm font-medium text-link"
          >
            {t('why.trustLink')}
          </Link>
        </p>
      )}
    </section>
  );
}

function Fact({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-figure font-semibold text-foreground text-row">{children}</dd>
    </div>
  );
}

function PointsSkeleton({ count }: { readonly count: number }) {
  const { t } = useT('forecast');
  return (
    <ul className="flex flex-col">
      {Array.from({ length: Math.max(count, 1) }, (_, i) => `point-${i}`).map((id) => (
        <li key={id} className="py-2.25 ps-6 text-sm">
          <SkeletonLines>{t('why.label')}</SkeletonLines>
        </li>
      ))}
    </ul>
  );
}
