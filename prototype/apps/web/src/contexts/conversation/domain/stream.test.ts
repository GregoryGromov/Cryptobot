import { describe, expect, it } from 'vitest';
import { answer, chatOf, failedItem, NOON, pending, said } from './fixtures.test-util';
import { streamView, wordStepMs } from './stream';

const draft = { runId: 'run-1', sourceId: 'm1', text: 'Золото держится ', stoppedAt: null };

describe('streamView', () => {
  it('writes the draft where the wait for its run stood', () => {
    const chat = chatOf({ items: [said('m1', 'Что с золотом?')], pending: [pending({ id: 'run-1' })] });
    expect(streamView(chat, draft, null)).toEqual({
      kind: 'writing',
      runId: 'run-1',
      text: 'Золото держится ',
      waitId: 'run-1',
    });
  });

  it('knows the run by the message it answers before the run is read', () => {
    const chat = chatOf({ items: [said('m1', 'Что с золотом?')], pending: [pending({ id: 'm1' })] });
    expect(streamView(chat, draft, null).kind).toBe('writing');
  });

  it('keeps waiting while the draft has no words yet', () => {
    const chat = chatOf({ pending: [pending({ id: 'run-1' })] });
    expect(streamView(chat, { ...draft, text: '  ' }, null).kind).toBe('none');
  });

  it('writes the accepted answer to its end once the run is over', () => {
    const chat = chatOf({ items: [said('m1', 'Что?'), answer('m2', 'Золото держится выше уровня.')] });
    expect(streamView(chat, draft, null)).toEqual({
      kind: 'finishing',
      runId: 'run-1',
      text: 'Золото держится выше уровня.',
      key: 'm2',
      at: NOON,
    });
  });

  it('gives way to the answer once it is laid down', () => {
    const chat = chatOf({ items: [said('m1', 'Что?'), answer('m2', 'Золото держится выше уровня.')] });
    expect(streamView(chat, draft, 'run-1').kind).toBe('none');
  });

  it('ignores an answer that is not the draft written on', () => {
    const chat = chatOf({ seq: 3, items: [said('m1', 'Что?'), answer('m2', 'Совсем другой ответ.')] });
    expect(streamView(chat, { ...draft, stoppedAt: 2 }, null).kind).toBe('none');
  });

  it('keeps writing while the run is over and its answer not saved yet', () => {
    const chat = chatOf({ seq: 2, items: [said('m1', 'Что с золотом?')] });
    expect(streamView(chat, draft, null)).toEqual({
      kind: 'writing',
      runId: 'run-1',
      text: 'Золото держится ',
      waitId: 'm1',
    });
  });

  it('keeps writing until the conversation is read again after the draft stopped', () => {
    const chat = chatOf({ seq: 2, items: [said('m1', 'Что с золотом?')] });
    expect(streamView(chat, { ...draft, stoppedAt: 2 }, null).kind).toBe('writing');
  });

  it('lets the words go when their run failed', () => {
    const chat = chatOf({ seq: 2, items: [said('m1', 'Что с золотом?'), failedItem('1', 'converse')] });
    expect(streamView(chat, draft, null).kind).toBe('none');
  });

  it('lets the words go when the conversation read after them has no answer', () => {
    const chat = chatOf({ seq: 3, items: [said('m1', 'Что с золотом?')] });
    expect(streamView(chat, { ...draft, stoppedAt: 2 }, null).kind).toBe('none');
  });
});

describe('wordStepMs', () => {
  it('keeps an even pace when the stream is not ahead', () => {
    expect(wordStepMs(1)).toBe(42);
  });

  it('shortens the step to catch up with a stream far ahead', () => {
    expect(wordStepMs(20)).toBe(14);
  });
});
