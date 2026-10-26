import { Button } from '@reinforce/ui-react/button';
import { Input } from '@reinforce/ui-react/input';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { match } from 'ts-pattern';
import type { Bounds } from '~/contexts/settings/domain/limits';
import { checkCount } from '~/contexts/settings/domain/parse-amount';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { FieldProblem, SettingItem } from './settings-section';

export function CountSetting({
  label,
  hint,
  value,
  bounds,
  onCommit,
}: {
  readonly label: string;
  readonly hint: string;
  readonly value: number;
  readonly bounds: Bounds;
  readonly onCommit: (value: number) => void;
}) {
  const { t } = useT('settings');
  const { int } = useFormatters();
  const id = useId();
  const hintId = useId();
  const problemId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const checked = draft === null ? null : checkCount(draft, bounds);
  const problem = checked?.kind === 'problem' ? checked.problem : null;
  const commit = (next: number) => {
    setDraft(null);
    if (next !== value) onCommit(next);
  };
  const commitDraft = () => {
    if (checked?.kind === 'ok') commit(checked.value);
  };
  return (
    <SettingItem>
      <SettingRow htmlFor={id} label={label} description={<span id={hintId}>{hint}</span>}>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={t('count.less', { label })}
            disabled={value <= bounds.min}
            onClick={() => commit(value - 1)}
          >
            <Minus />
          </Button>
          <Input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            className="w-14 text-center font-figure"
            value={draft ?? String(value)}
            aria-invalid={problem !== null}
            aria-describedby={problem === null ? hintId : `${hintId} ${problemId}`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDraft();
              if (event.key === 'Escape') setDraft(null);
            }}
          />
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={t('count.more', { label })}
            disabled={value >= bounds.max}
            onClick={() => commit(value + 1)}
          >
            <Plus />
          </Button>
        </div>
      </SettingRow>
      {problem && (
        <FieldProblem id={problemId}>
          {match(problem)
            .with('format', () => t('count.format'))
            .with('range', () => t('count.range', { min: int(bounds.min), max: int(bounds.max) }))
            .exhaustive()}
        </FieldProblem>
      )}
    </SettingItem>
  );
}
