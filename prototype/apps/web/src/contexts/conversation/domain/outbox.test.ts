import { describe, expect, it } from 'vitest';
import { answer, chatOf, forecastNote, message, NOON, pending, said } from './fixtures.test-util';
import { echoesOf, outboxReducer, type Said, saidAt, waitsOf } from './outbox';

const before = chatOf({ items: [said('m1', 'Привет'), answer('m2', 'Здравствуйте')] });

const sent = (requestId: string, text: string | null, wait: Said['wait'] = 'converse'): Said =>
  saidAt({ requestId, text, wait }, NOON + 1000);

describe('outboxReducer', () => {
  it('keeps what was said in the order it was said', () => {
    const state = outboxReducer(outboxReducer([], { type: 'said', said: sent('r1', 'Один') }), {
      type: 'said',
      said: sent('r2', 'Два'),
    });
    expect(state.map((item) => item.requestId)).toEqual(['r1', 'r2']);
  });

  it('remembers what the server answered the request with', () => {
    const state = outboxReducer([sent('r1', 'Один')], { type: 'accepted', requestId: 'r1', entry: 'm3' });
    expect(state[0]?.entry).toBe('m3');
  });

  it('drops words the server did not take', () => {
    expect(outboxReducer([sent('r1', 'Один')], { type: 'failed', requestId: 'r1' })).toEqual([]);
  });

  it('keeps a refused request with the reason it was refused', () => {
    const state = outboxReducer([sent('r1', null, 'forecast')], {
      type: 'refused',
      requestId: 'r1',
      reason: 'Мало сделок.',
    });
    expect(state.map((said) => said.refused)).toEqual(['Мало сделок.']);
  });

  it('lets go of what was refused once something new is said', () => {
    const refused = { ...sent('r1', null, 'forecast'), refused: 'Мало сделок.' };
    const state = outboxReducer([refused], { type: 'said', said: sent('r2', 'Вопрос') });
    expect(state.map((said) => said.requestId)).toEqual(['r2']);
  });

  it('replaces the words of a request said again', () => {
    const state = outboxReducer([sent('r1', 'Один')], { type: 'said', said: sent('r1', 'Один') });
    expect(state).toHaveLength(1);
  });
});

describe('echoesOf', () => {
  it('keeps the echo while the server has not shown the words', () => {
    const echoes = echoesOf(before, [sent('r1', 'Что с биткоином?')]);
    expect(echoes.waiting.map((item) => item.requestId)).toEqual(['r1']);
  });

  it('lands the echo on the words sent with its request, whatever they say', () => {
    const after = chatOf({ items: [...before.items, { ...said('m3', 'другой текст'), requestId: 'r1' }] });
    const echoes = echoesOf(after, [sent('r1', 'Что с биткоином?')]);
    expect({ waiting: echoes.waiting.length, landed: [...echoes.landed] }).toEqual({
      waiting: 0,
      landed: ['m3'],
    });
  });

  it('does not land an echo on the same words sent with another request', () => {
    const after = chatOf({ items: [...before.items, { ...said('m3', 'Один'), requestId: 'r0' }] });
    expect(echoesOf(after, [sent('r1', 'Один')]).waiting).toHaveLength(1);
  });

  it('lands a bare analysis once the server shows the run of its dispatch', () => {
    const after = chatOf({ items: before.items, pending: [pending({ id: 'd1', kind: 'forecast' })] });
    const echoes = echoesOf(after, [{ ...sent('r1', null, 'forecast'), entry: 'd1' }]);
    expect([...echoes.landed]).toEqual(['d1']);
  });

  it('lands a bare analysis on its forecast when the run was never seen', () => {
    const forecast = message({ key: 'f1', forecast: forecastNote('fc1', 'd1') });
    const after = chatOf({ items: [...before.items, forecast] });
    expect([...echoesOf(after, [{ ...sent('r1', null, 'forecast'), entry: 'd1' }]).landed]).toEqual(['f1']);
  });

  it('does not wait on a refused request', () => {
    const echoes = echoesOf(before, [{ ...sent('r1', null, 'forecast'), refused: 'Мало сделок.' }]);
    expect({ unshown: echoes.unshown.length, waiting: echoes.waiting.length }).toEqual({
      unshown: 1,
      waiting: 0,
    });
  });

  it('keeps a bare analysis waiting until the server names its dispatch', () => {
    const after = chatOf({ items: before.items, pending: [pending({ id: 'd0', kind: 'forecast' })] });
    expect(echoesOf(after, [sent('r1', null, 'forecast')]).waiting).toHaveLength(1);
  });
});

describe('waitsOf', () => {
  it('waits on what the server runs once it runs something', () => {
    const runs = [pending({ id: 'run-1' })];
    expect(waitsOf(runs, [sent('r1', 'Вопрос')])).toEqual(runs);
  });

  it('waits on the words just said until the server runs them', () => {
    expect(waitsOf([], [sent('r1', 'Вопрос', 'forecast')])).toEqual([
      { id: 'r1', kind: 'forecast', t0: null, deadline: null, since: NOON + 1000, attempt: 1 },
    ]);
  });

  it('times a run from when it was asked for when that was earlier', () => {
    const runs = [pending({ id: 'd1', kind: 'forecast', since: NOON + 4000 })];
    expect(waitsOf(runs, [], new Map([['d1', NOON + 1000]])).map((run) => run.since)).toEqual([NOON + 1000]);
  });
});
