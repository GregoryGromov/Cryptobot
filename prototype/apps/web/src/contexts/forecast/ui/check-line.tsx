import type { ChatItem } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { CircleCheck, CircleDashed, CircleMinus, CircleX, type LucideIcon } from 'lucide-react';
import { match } from 'ts-pattern';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useT } from '~/shared/i18n';
import { directionClass } from '~/shared/ui/direction-class';
import { type CheckMark, checkMark, checkWords, horizonWords } from '../domain/verdict';
import { unscoredWords } from './forecast-words';

type Check = Extract<ChatItem, { kind: 'check' }>;

const markIcon = (mark: CheckMark): { readonly icon: LucideIcon; readonly className: string } =>
  match(mark)
    .with('hit', () => ({ icon: CircleCheck, className: 'text-foreground' }))
    .with('flat', () => ({ icon: CircleMinus, className: 'text-muted-foreground' }))
    .with('miss', () => ({ icon: CircleX, className: 'text-muted-foreground' }))
    .with('none', () => ({ icon: CircleDashed, className: 'text-muted-foreground' }))
    .exhaustive();

export function CheckLine({ check }: { readonly check: Check }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { icon: Icon, className } = markIcon(checkMark(check.lean, check.cls));
  const horizon = horizonWords(format, check.horizon);
  const verdict = checkWords(format, check.lean, check.cls);
  const unscored = unscoredWords(check.cohort, format);
  return (
    <p className="flex items-start justify-center gap-2 px-2 text-center text-meta text-muted-foreground">
      <Icon aria-hidden className={cn('mt-px size-4 shrink-0', className)} strokeWidth={2} />
      <span>
        {check.returnPct === null ? (
          t('check.empty', { horizon, verdict })
        ) : (
          <Trans
            t={t}
            i18nKey="check.line"
            values={{ horizon, verdict, change: fmt.change(check.returnPct, 2) }}
            components={{
              move: (
                <span
                  className={cn('font-figure font-medium', directionClass(directionOf(check.returnPct, 2)))}
                />
              ),
            }}
          />
        )}
        {unscored && <span className="text-muted-foreground"> · {unscored}</span>}
      </span>
    </p>
  );
}
