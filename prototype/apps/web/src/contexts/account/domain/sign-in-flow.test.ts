import { describe, expect, it } from 'vitest';
import { CLOSED, type Device, signInStep, visibleFlow } from './sign-in-flow';

const device: Device = {
  userCode: 'ABCD-EFGH',
  url: 'https://accounts.x.ai/device?code=ABCD-EFGH',
  expiresAt: 1,
};

describe('signInStep', () => {
  it('starts from any state when a sign-in is requested', () => {
    expect(signInStep({ kind: 'failed', reason: 'no' }, { kind: 'requested' })).toEqual({ kind: 'starting' });
  });

  it('waits for the confirmation once the code is issued', () => {
    expect(signInStep({ kind: 'starting' }, { kind: 'issued', device })).toEqual({ kind: 'waiting', device });
  });

  it('ignores a code that arrives after the dialog was closed', () => {
    expect(signInStep(CLOSED, { kind: 'issued', device })).toEqual({ kind: 'closed' });
  });

  it('shows the reason when waiting fails', () => {
    expect(signInStep({ kind: 'waiting', device }, { kind: 'failed', reason: 'Код истёк.' })).toEqual({
      kind: 'failed',
      reason: 'Код истёк.',
    });
  });

  it('stays closed when a failure arrives after closing', () => {
    expect(signInStep(CLOSED, { kind: 'failed', reason: 'Вход отменён.' })).toEqual({ kind: 'closed' });
  });
});

describe('visibleFlow', () => {
  it('resumes a login already started in this session', () => {
    expect(visibleFlow(CLOSED, device)).toEqual({ kind: 'waiting', device });
  });

  it('keeps an open flow as it is', () => {
    expect(visibleFlow({ kind: 'failed', reason: 'нет' }, device)).toEqual({ kind: 'failed', reason: 'нет' });
  });
});
