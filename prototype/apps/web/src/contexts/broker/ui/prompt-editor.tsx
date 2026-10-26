import type { AgentView } from '@reinforce/server/dto';
import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { settingRowDescriptionClass } from '@reinforce/ui-primitives/setting-row';
import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Input } from '@reinforce/ui-react/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@reinforce/ui-react/select';
import { Textarea } from '@reinforce/ui-react/textarea';
import { cn } from '@reinforce/ui-styles/cn';
import { useId, useReducer, useState } from 'react';
import { useSaveVersion } from '~/contexts/broker/api/use-broker-versions';
import {
  type BrokerFields,
  currentDraft,
  draftChanged,
  draftConflict,
  draftReducer,
  latestBase,
  planSave,
} from '~/contexts/broker/domain/broker-draft';
import { NOTE_LENGTH, PROMPT_LENGTH } from '~/contexts/broker/domain/limits';
import { errorText } from '~/shared/api/error-map';
import { RejectedError } from '~/shared/api/rejection';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { DraftConflict } from './draft-conflict';

export function PromptEditor({ agent }: { readonly agent: AgentView }) {
  const { t } = useT('broker');
  const { int } = useFormatters();
  const [state, dispatch] = useReducer(draftReducer, null);
  const [savedN, setSavedN] = useState<number | null>(null);
  const save = useSaveVersion();
  const latest = latestBase(agent);
  const draft = currentDraft(state, latest);
  const conflict = draftConflict(draft, latest);
  const { prompt, model, note } = draft.fields;
  const tooShort = prompt.trim().length < PROMPT_LENGTH.min;
  const models = agent.availableModels;
  const promptId = useId();
  const promptHintId = useId();
  const canSave =
    draftChanged(draft) &&
    !draft.saving &&
    !conflict &&
    !tooShort &&
    models.includes(model) &&
    latest.id !== null;
  const edit = (field: keyof BrokerFields, value: string) => {
    setSavedN(null);
    if (save.isError) save.reset();
    dispatch({ type: 'edited', field, value, latest });
  };
  const submit = () => {
    const plan = planSave(draft, crypto.randomUUID());
    if (!plan) return;
    setSavedN(null);
    dispatch({ type: 'submitted', intent: plan.intent, latest });
    save.mutate(plan.input, {
      onSuccess: (result) => {
        if (result.kind !== 'saved') return;
        dispatch({ type: 'saved', id: result.version.id, submitted: plan.input });
        setSavedN(result.version.number);
      },
      onError: () => dispatch({ type: 'failed' }),
    });
  };
  const promptRejected = Boolean(save.error?.data?.fieldErrors?.prompt);
  const failure =
    save.error instanceof RejectedError ? save.error.message : save.error && errorText(save.error);
  return (
    <section
      aria-label={t('instructions.title')}
      className={cn(sectionCardClass, 'flex flex-col gap-4 px-4 pb-5 sm:px-6')}
    >
      <div className="flex flex-col gap-2">
        <Textarea
          id={promptId}
          rows={10}
          maxLength={PROMPT_LENGTH.max}
          value={prompt}
          aria-label={t('instructions.prompt')}
          aria-invalid={tooShort || promptRejected}
          aria-describedby={promptHintId}
          onChange={(event) => edit('prompt', event.target.value)}
        />
        <p id={promptHintId} className={cn(settingRowDescriptionClass, 'flex justify-between gap-3')}>
          <span className={cn((tooShort || promptRejected) && 'text-destructive')}>
            {tooShort || promptRejected ? t('instructions.tooShort', { min: int(PROMPT_LENGTH.min) }) : ''}
          </span>
          {PROMPT_LENGTH.max !== undefined && (
            <span className="shrink-0 font-figure">
              {t('instructions.promptCount', { n: int(prompt.length), max: int(PROMPT_LENGTH.max) })}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={model} disabled={models.length === 0} onValueChange={(value) => edit('model', value)}>
          <SelectTrigger aria-label={t('instructions.model')} className="w-full sm:w-52">
            <SelectValue placeholder={t('instructions.noModels')} />
          </SelectTrigger>
          <SelectContent>
            {models.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          maxLength={NOTE_LENGTH}
          aria-label={t('instructions.note')}
          placeholder={t('instructions.notePlaceholder')}
          value={note}
          className="min-w-48 flex-1"
          onChange={(event) => edit('note', event.target.value)}
        />
        <Button disabled={!canSave} loading={draft.saving} className="w-full sm:w-auto" onClick={submit}>
          {t('instructions.save')}
        </Button>
      </div>
      {conflict && (
        <DraftConflict
          onKeep={() => dispatch({ type: 'rebased', latest })}
          onReset={() => dispatch({ type: 'reset' })}
        />
      )}
      {failure && (
        <InlineNote tone="warning" role="alert">
          {failure}
        </InlineNote>
      )}
      <span role="status" className="text-meta text-muted-foreground empty:hidden">
        {savedN === null ? '' : t('instructions.saved', { n: savedN })}
      </span>
    </section>
  );
}
