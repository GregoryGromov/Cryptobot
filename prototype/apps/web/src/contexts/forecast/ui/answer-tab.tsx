import type { ForecastNote, Inputs } from '@reinforce/server/dto';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { outcomesOf } from '../domain/horizon-vm';
import { horizonWords } from '../domain/verdict';
import { Corridor } from './corridor';
import { EvaluationHistory } from './evaluation-history';
import { planWords, unscoredWords } from './forecast-words';
import { OddsTicks } from './odds-ticks';

export function AnswerTab({ forecast, data }: { readonly forecast: ForecastNote; readonly data: Inputs }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const horizons = [...forecast.horizons].sort((a, b) => a.horizon - b.horizon);
  const many = horizons.length > 1;
  const facts = [
    many ? `${t('data.plan')}: ${planWords(forecast.plan, t, format, fmt)}` : null,
    `${t('data.received')} ${t('data.receivedAt', {
      time: fmt.dateTime(forecast.at),
      cohort: unscoredWords(forecast.cohort, format) ?? t('data.official'),
    })}`,
    forecast.version === null ? null : `${t('data.version')} ${fmt.int(forecast.version)}`,
    data.quality.valid ? t('data.valid') : t('data.partial'),
    data.quality.detector === null ? null : t('data.detector', { name: data.quality.detector }),
    data.quality.features === null ? null : t('data.features', { name: data.quality.features }),
  ].filter((fact) => fact !== null);
  return (
    <div className="flex flex-col gap-4">
      {horizons.map((h) => (
        <div key={h.horizon} className="flex flex-col gap-3">
          {many && <p className="font-medium text-foreground text-sm">{horizonWords(format, h.horizon)}</p>}
          <OddsTicks
            outcomes={outcomesOf(forecast.p0, h)}
            label={t('horizon.outcomes')}
            flat={t('horizon.flat', { band: fmt.percent(h.tau, 1) })}
          />
          <Corridor horizon={h} />
        </div>
      ))}
      <EvaluationHistory forecastId={forecast.id} horizons={horizons.map((h) => h.horizon)} />
      <p className="text-muted-foreground text-xs">{facts.join(' · ')}</p>
    </div>
  );
}
