import { amountFieldClass, amountFieldShellClass } from '@reinforce/ui-primitives/amount-field';
import { Input } from '@reinforce/ui-react/input';
import { Label } from '@reinforce/ui-react/label';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import type { FieldCheck, FieldProblem } from '../domain/ticket-vm';

export type TicketField = 'amount' | 'stop' | 'take';

const plainDigits = (value: number): number => [0, 1, 2].find((d) => Number(value.toFixed(d)) === value) ?? 2;

function useProblemText(): (field: TicketField, problem: FieldProblem) => string {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const percent = (value: number) => fmt.percent(value, plainDigits(value));
  return (field, problem) =>
    match(problem)
      .with({ kind: 'empty' }, () =>
        field === 'amount' ? t('ticket.problem.amountEmpty') : t('ticket.problem.percentEmpty'),
      )
      .with({ kind: 'format' }, () =>
        field === 'amount' ? t('ticket.problem.amountFormat') : t('ticket.problem.percentFormat'),
      )
      .with({ kind: 'precision' }, () =>
        field === 'amount' ? t('ticket.problem.amountPrecision') : t('ticket.problem.percentPrecision'),
      )
      .with({ kind: 'range' }, ({ min, max }) =>
        match(field)
          .with('amount', () => t('ticket.problem.amountRange', { min: fmt.usd(min), max: fmt.usd(max) }))
          .with('stop', () => t('ticket.problem.stopRange', { min: percent(min), max: percent(max) }))
          .with('take', () => t('ticket.problem.takeRange', { min: percent(min), max: percent(max) }))
          .exhaustive(),
      )
      .with({ kind: 'slippage' }, ({ min }) => t('ticket.problem.takeSlippage', { min: percent(min) }))
      .exhaustive();
}

function FieldError({ id, text }: { readonly id: string; readonly text: string | null }) {
  if (text === null) return null;
  return (
    <span id={id} role="status" className="font-medium text-destructive text-xs leading-snug">
      {text}
    </span>
  );
}

export function AmountInput({
  value,
  check,
  hint,
  onChange,
}: {
  readonly value: string;
  readonly check: FieldCheck;
  readonly hint: string;
  readonly onChange: (value: string) => void;
}) {
  const { t } = useT('trading');
  const id = useId();
  const problemText = useProblemText();
  const error = check.kind === 'problem' ? problemText('amount', check.problem) : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id} className="text-muted-foreground text-xs">
          {t('ticket.amount')}
        </Label>
        <span className="font-figure text-muted-foreground text-xs">{hint}</span>
      </div>
      <div className={amountFieldShellClass}>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-invalid={error !== null}
          aria-describedby={error === null ? undefined : `${id}-error`}
          className={cn(amountFieldClass, error !== null && 'text-destructive caret-destructive')}
        />
      </div>
      <FieldError id={`${id}-error`} text={error} />
    </div>
  );
}

export function PercentInput({
  field,
  label,
  value,
  check,
  onChange,
}: {
  readonly field: Exclude<TicketField, 'amount'>;
  readonly label: string;
  readonly value: string;
  readonly check: FieldCheck;
  readonly onChange: (value: string) => void;
}) {
  const id = useId();
  const problemText = useProblemText();
  const error = check.kind === 'problem' ? problemText(field, check.problem) : null;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : `${id}-error`}
        className="font-figure"
      />
      <FieldError id={`${id}-error`} text={error} />
    </div>
  );
}
