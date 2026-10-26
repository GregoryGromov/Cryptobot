import {
  inlineAmountAffixClass,
  inlineAmountFieldClass,
  inlineAmountShellClass,
} from '@reinforce/ui-primitives/amount-field';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { cn } from '@reinforce/ui-styles/cn';
import { useId, useState } from 'react';
import { match } from 'ts-pattern';
import { MAX_TRADE } from '~/contexts/settings/domain/limits';
import { checkAmount, parseAmount } from '~/contexts/settings/domain/parse-amount';
import { useFormatters } from '~/shared/format/use-formatters';
import { useLocale, useT } from '~/shared/i18n';
import { FieldProblem, SettingItem } from './settings-section';

const EXAMPLE = 2500;

export function TradeCapSetting({
  value,
  onCommit,
}: {
  readonly value: number;
  readonly onCommit: (decimal: string) => void;
}) {
  const { t } = useT('settings');
  const locale = useLocale();
  const { decimal, usdWhole } = useFormatters();
  const id = useId();
  const hintId = useId();
  const problemId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const checked = draft === null ? null : checkAmount(parseAmount(draft, locale), MAX_TRADE);
  const problem = checked?.kind === 'problem' ? checked.problem : null;
  const commitDraft = () => {
    if (checked?.kind !== 'ok') return;
    setDraft(null);
    if (checked.value !== value) onCommit(checked.decimal);
  };
  return (
    <SettingItem>
      <SettingRow
        htmlFor={id}
        label={t('broker.maxTrade')}
        description={<span id={hintId}>{t('broker.maxTradeHint', { max: usdWhole(MAX_TRADE) })}</span>}
      >
        <span className={inlineAmountShellClass}>
          <span aria-hidden className={inlineAmountAffixClass}>
            {t('amount.sign')}
          </span>
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            className={cn(inlineAmountFieldClass, 'field-sizing-content text-base')}
            value={draft ?? decimal(value, Number.isInteger(value) ? 0 : 2)}
            aria-invalid={problem !== null}
            aria-describedby={problem === null ? hintId : `${hintId} ${problemId}`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDraft();
              if (event.key === 'Escape') setDraft(null);
            }}
          />
        </span>
      </SettingRow>
      {problem && (
        <FieldProblem id={problemId}>
          {match(problem)
            .with('required', () => t('amount.required'))
            .with('format', () => t('amount.format', { example: decimal(EXAMPLE, 0) }))
            .with('positive', () => t('amount.positive'))
            .with('max', () => t('amount.max', { max: usdWhole(MAX_TRADE) }))
            .exhaustive()}
        </FieldProblem>
      )}
    </SettingItem>
  );
}
