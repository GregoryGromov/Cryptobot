import type { Horizon } from '@reinforce/server/dto';
import { SkeletonLines } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { directionClass } from '~/shared/ui/direction-class';
import { useEvaluations } from '../api/queries';
import { type EvaluationPolicy, type EvaluationRow, evaluationPolicies } from '../domain/evaluations-vm';
import { horizonWords } from '../domain/verdict';

const BRIER_DIGITS = 3;

export function EvaluationHistory({
  forecastId,
  horizons,
}: {
  readonly forecastId: string;
  readonly horizons: readonly Horizon[];
}) {
  const { t } = useT('forecast');
  const evaluations = useEvaluations(forecastId);
  const titleId = useId();
  const shown = (policies: readonly EvaluationPolicy[]): readonly EvaluationPolicy[] =>
    policies.map((policy) => ({
      ...policy,
      rows: policy.rows.filter((row) => horizons.includes(row.horizon)),
    }));
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h4 id={titleId} className={horizons.length > 1 ? 'font-medium text-foreground text-sm' : 'sr-only'}>
        {t('evaluations.title')}
      </h4>
      <AsyncView
        query={evaluations}
        errorTitle={t('evaluations.failed')}
        loading={
          <p className="text-meta">
            <SkeletonLines>{t('evaluations.empty')}</SkeletonLines>
          </p>
        }
        empty={{
          when: (data) => shown(evaluationPolicies(data)).every((p) => p.rows.length === 0),
          render: <p className="text-meta text-muted-foreground">{t('evaluations.empty')}</p>,
        }}
      >
        {(data) => <Policies policies={shown(evaluationPolicies(data))} />}
      </AsyncView>
    </section>
  );
}

function Policies({ policies }: { readonly policies: readonly EvaluationPolicy[] }) {
  const { t } = useT('forecast');
  const rescored = policies.some((p) => !p.original);
  return (
    <div className="flex flex-col gap-3">
      {policies.map((policy) => (
        <div key={policy.version} className="flex flex-col gap-1.5">
          {rescored && (
            <p className="text-muted-foreground text-xs">
              {policy.original
                ? t('evaluations.original')
                : t('evaluations.rescored', { version: policy.version })}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {policy.rows.map((row) => (
              <Row key={row.key} row={row} />
            ))}
          </ul>
        </div>
      ))}
      {rescored && <p className="text-muted-foreground text-xs">{t('evaluations.note')}</p>}
    </div>
  );
}

function Row({ row }: { readonly row: EvaluationRow }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const scored =
    row.reference === null
      ? t('evaluations.noReference')
      : t('evaluations.score', {
          brier: fmt.decimal(row.brier, BRIER_DIGITS),
          reference: fmt.decimal(row.reference, BRIER_DIGITS),
          observations: t('evaluations.observations', { count: row.observations }),
        });
  return (
    <li
      title={`${scored} · ${t('evaluations.computed', { time: fmt.dateTime(row.computedAt) })}`}
      className="text-sm"
    >
      <span className="text-foreground-soft">
        <Trans
          t={t}
          i18nKey="evaluations.row"
          values={{
            term: horizonWords(format, row.horizon),
            outcome: t(`evaluations.outcome.${row.outcome}`),
            change: fmt.change(row.returnPct, 2),
          }}
          components={{
            move: <span className={cn('font-figure', directionClass(directionOf(row.returnPct, 2)))} />,
          }}
        />
        {' · '}
        {t(`evaluations.skill.${row.skill}`)}
      </span>
    </li>
  );
}
