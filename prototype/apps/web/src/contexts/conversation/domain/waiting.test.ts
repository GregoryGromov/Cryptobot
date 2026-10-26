import { describe, expect, it } from 'vitest';
import { NOON, pending } from './fixtures.test-util';
import { waitRows, waitView } from './waiting';

describe('waitView', () => {
  it('calls an answer slow once it has taken twenty seconds', () => {
    const run = pending({ id: 'm1', kind: 'converse', since: NOON });
    expect([waitView(run, NOON + 19_000).slow, waitView(run, NOON + 20_000).slow]).toEqual([false, true]);
  });

  it('never calls an analysis slow, which takes its own time', () => {
    expect(waitView(pending({ id: 'd1', kind: 'forecast', since: NOON }), NOON + 60_000).slow).toBe(false);
  });

  it('names a retry only from the second attempt on', () => {
    expect([
      waitView(pending({ id: 'a', attempt: 1 }), NOON).retry,
      waitView(pending({ id: 'b', attempt: 2 }), NOON).retry,
    ]).toEqual([false, true]);
  });

  it('counts whole seconds since the run began', () => {
    expect(waitView(pending({ id: 'run' }), NOON + 75_900).clock).toBe(75);
  });

  it('starts counting only at five seconds', () => {
    const run = pending({ id: 'run' });
    expect([waitView(run, NOON + 4_900).clock, waitView(run, NOON + 5_000).clock]).toEqual([null, 5]);
  });

  it('never counts back before the run began', () => {
    expect(waitView(pending({ id: 'run' }), NOON - 5_000).clock).toBeNull();
  });
});

describe('waitRows', () => {
  it('keeps the first wait in one place from the words to the run', () => {
    expect(waitRows([pending({ id: 'r1' }), pending({ id: 'r2' })], null).map((row) => row.key)).toEqual([
      'wait-lead',
      'wait-r2',
    ]);
  });

  it('leaves out the wait an answer is being written for', () => {
    expect(waitRows([pending({ id: 'r1' })], 'r1')).toEqual([]);
  });
});
