import { describe, expect, it } from 'vitest';
import {
  type BrokerBase,
  currentDraft,
  type DraftEvent,
  type DraftState,
  draftChanged,
  draftConflict,
  draftReducer,
  planSave,
} from './broker-draft';

const first: BrokerBase = { id: 'v1', prompt: 'First instructions', model: 'grok-a' };
const second: BrokerBase = { id: 'v2', prompt: 'Changed elsewhere', model: 'grok-b' };
const third: BrokerBase = { id: 'v3', prompt: 'Third instructions', model: 'grok-a' };

const fold = (events: readonly DraftEvent[], state: DraftState = null): DraftState =>
  events.reduce(draftReducer, state);

const edit = (field: 'prompt' | 'model' | 'note', value: string, latest = first): DraftEvent => ({
  type: 'edited',
  field,
  value,
  latest,
});

const submit = (state: DraftState, latest: BrokerBase, requestId: string): DraftState => {
  const plan = planSave(currentDraft(state, latest), requestId);
  return plan && draftReducer(state, { type: 'submitted', intent: plan.intent, latest });
};

describe('the instructions form', () => {
  it('follows a version turned on elsewhere while nothing is typed', () => {
    const draft = currentDraft(null, second);
    expect(draft.fields).toEqual({ prompt: 'Changed elsewhere', model: 'grok-b', note: '' });
    expect(draftConflict(draft, second)).toBe(false);
  });

  it.each(['prompt', 'model', 'note'] as const)(
    'keeps an unsaved %s when another version is turned on, and says so',
    (field) => {
      const draft = currentDraft(fold([edit(field, 'My edit')]), second);
      expect(draft.fields[field]).toBe('My edit');
      expect(draftConflict(draft, second)).toBe(true);
    },
  );

  it('carries an unsaved edit onto the newer version and takes the rest from it', () => {
    const state = fold([edit('note', 'Careful on small coins'), { type: 'rebased', latest: second }]);
    const draft = currentDraft(state, second);
    expect(draft.fields).toEqual({
      prompt: 'Changed elsewhere',
      model: 'grok-b',
      note: 'Careful on small coins',
    });
    expect(draftConflict(draft, second)).toBe(false);
  });

  it('starts over from the newer version when the edits are dropped', () => {
    const state = fold([edit('prompt', 'My edit'), { type: 'reset' }]);
    expect(currentDraft(state, second).fields.prompt).toBe('Changed elsewhere');
  });

  it('keeps what is typed during a save, including the next note', () => {
    const typed = fold([edit('prompt', 'Submitted instructions'), edit('note', 'First change')]);
    const saving = submit(typed, first, 'request-1');
    const submitted = { prompt: 'Submitted instructions', model: 'grok-a', note: 'First change' };
    const after = fold(
      [
        edit('prompt', 'Next instructions'),
        edit('note', 'Next change'),
        { type: 'saved', id: 'v2', submitted },
      ],
      saving,
    );
    const draft = currentDraft(after, { id: 'v2', prompt: submitted.prompt, model: submitted.model });
    expect(draft.fields).toEqual({ prompt: 'Next instructions', model: 'grok-a', note: 'Next change' });
    expect(draftChanged(draft)).toBe(true);
  });

  it('clears only the saved note and leaves text put back during the save as an unsaved change', () => {
    const typed = fold([edit('prompt', 'Submitted instructions'), edit('note', 'First change')]);
    const saving = submit(typed, first, 'request-1');
    const submitted = { prompt: 'Submitted instructions', model: 'grok-a', note: 'First change' };
    const after = fold([edit('prompt', first.prompt), { type: 'saved', id: 'v2', submitted }], saving);
    const draft = currentDraft(after, { id: 'v2', prompt: submitted.prompt, model: submitted.model });
    expect(draft.fields).toEqual({ prompt: 'First instructions', model: 'grok-a', note: '' });
    expect(draftChanged(draft)).toBe(true);
  });

  it('follows a third version turned on during the save once nothing is left unsaved', () => {
    const typed = fold([edit('prompt', 'My saved instructions')]);
    const saving = submit(typed, first, 'request-1');
    const submitted = { prompt: 'My saved instructions', model: 'grok-a', note: '' };
    const after = fold([{ type: 'saved', id: 'v2', submitted }], saving);
    expect(currentDraft(after, third).fields.prompt).toBe('Third instructions');
  });
});

describe('saving the instructions', () => {
  it('sends the same request id when the same edit is retried after a failure', () => {
    const typed = fold([edit('prompt', 'Careful instructions')]);
    const failed = fold([{ type: 'failed' }], submit(typed, first, 'request-1'));
    expect(planSave(currentDraft(failed, first), 'request-2')?.input).toEqual({
      baseVersionId: 'v1',
      prompt: 'Careful instructions',
      model: 'grok-a',
      note: '',
      requestId: 'request-1',
    });
  });

  it('takes a new request id once the edit changes after a failure', () => {
    const typed = fold([edit('prompt', 'Careful instructions')]);
    const failed = fold([{ type: 'failed' }, edit('note', 'Why')], submit(typed, first, 'request-1'));
    expect(planSave(currentDraft(failed, first), 'request-2')?.input.requestId).toBe('request-2');
  });

  it('cannot be saved without a version to build on', () => {
    const draft = currentDraft(null, { id: null, prompt: 'Template', model: 'grok-a' });
    expect(planSave(draft, 'request-1')).toBeNull();
  });
});
