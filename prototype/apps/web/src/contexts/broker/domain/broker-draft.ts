import { match } from 'ts-pattern';

export type BrokerBase = { readonly id: string | null; readonly prompt: string; readonly model: string };

export type BrokerFields = { readonly prompt: string; readonly model: string; readonly note: string };

export type SaveIntent = { readonly fingerprint: string; readonly requestId: string };

export type BrokerDraft = {
  readonly base: BrokerBase;
  readonly fields: BrokerFields;
  readonly saving: boolean;
  readonly intent: SaveIntent | null;
};

export type DraftState = BrokerDraft | null;

export type DraftEvent =
  | {
      readonly type: 'edited';
      readonly field: keyof BrokerFields;
      readonly value: string;
      readonly latest: BrokerBase;
    }
  | { readonly type: 'submitted'; readonly intent: SaveIntent; readonly latest: BrokerBase }
  | { readonly type: 'saved'; readonly id: string; readonly submitted: BrokerFields }
  | { readonly type: 'failed' }
  | { readonly type: 'rebased'; readonly latest: BrokerBase }
  | { readonly type: 'reset' };

export type SaveInput = BrokerFields & { readonly baseVersionId: string; readonly requestId: string };

const freshDraft = (base: BrokerBase): BrokerDraft => ({
  base,
  fields: { prompt: base.prompt, model: base.model, note: '' },
  saving: false,
  intent: null,
});

export const draftChanged = (draft: BrokerDraft): boolean =>
  draft.fields.prompt !== draft.base.prompt ||
  draft.fields.model !== draft.base.model ||
  draft.fields.note !== '';

export const currentDraft = (state: DraftState, latest: BrokerBase): BrokerDraft =>
  state && (state.saving || draftChanged(state)) ? state : freshDraft(latest);

export const draftConflict = (draft: BrokerDraft, latest: BrokerBase): boolean => draft.base.id !== latest.id;

const savedDraft = (draft: BrokerDraft, submitted: BrokerFields, id: string): BrokerDraft => ({
  base: { id, prompt: submitted.prompt, model: submitted.model },
  fields: { ...draft.fields, note: draft.fields.note === submitted.note ? '' : draft.fields.note },
  saving: false,
  intent: null,
});

const rebasedDraft = (draft: BrokerDraft, latest: BrokerBase): BrokerDraft => ({
  ...draft,
  base: latest,
  fields: {
    ...draft.fields,
    prompt: draft.fields.prompt === draft.base.prompt ? latest.prompt : draft.fields.prompt,
    model: draft.fields.model === draft.base.model ? latest.model : draft.fields.model,
  },
});

const editedFields = (fields: BrokerFields, field: keyof BrokerFields, value: string): BrokerFields =>
  match(field)
    .with('prompt', () => ({ ...fields, prompt: value }))
    .with('model', () => ({ ...fields, model: value }))
    .with('note', () => ({ ...fields, note: value }))
    .exhaustive();

export const draftReducer = (state: DraftState, event: DraftEvent): DraftState =>
  match(event)
    .with({ type: 'edited' }, ({ field, value, latest }): DraftState => {
      const draft = currentDraft(state, latest);
      return { ...draft, fields: editedFields(draft.fields, field, value) };
    })
    .with(
      { type: 'submitted' },
      ({ intent, latest }): DraftState => ({
        ...currentDraft(state, latest),
        saving: true,
        intent,
      }),
    )
    .with({ type: 'saved' }, ({ id, submitted }): DraftState => state && savedDraft(state, submitted, id))
    .with({ type: 'failed' }, (): DraftState => state && { ...state, saving: false })
    .with({ type: 'rebased' }, ({ latest }): DraftState => state && rebasedDraft(state, latest))
    .with({ type: 'reset' }, (): DraftState => null)
    .exhaustive();

export const planSave = (
  draft: BrokerDraft,
  freshRequestId: string,
): { readonly intent: SaveIntent; readonly input: SaveInput } | null => {
  const baseVersionId = draft.base.id;
  if (baseVersionId === null) return null;
  const fingerprint = JSON.stringify([
    baseVersionId,
    draft.fields.prompt,
    draft.fields.model,
    draft.fields.note,
  ]);
  const requestId = draft.intent?.fingerprint === fingerprint ? draft.intent.requestId : freshRequestId;
  return { intent: { fingerprint, requestId }, input: { ...draft.fields, baseVersionId, requestId } };
};

export const latestBase = (agent: {
  readonly versions: readonly {
    readonly id: string;
    readonly active: boolean;
    readonly prompt: string;
    readonly modelId: string;
  }[];
  readonly templatePrompt: string;
  readonly availableModels: readonly string[];
}): BrokerBase => {
  const active = agent.versions.find((version) => version.active);
  if (active) return { id: active.id, prompt: active.prompt, model: active.modelId };
  return { id: null, prompt: agent.templatePrompt, model: agent.availableModels[0] ?? '' };
};
