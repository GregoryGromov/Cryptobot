import { describe, expect, it } from 'vitest';
import { isConversationPath, shellRouteOf } from './shell-route';

describe('shellRouteOf', () => {
  it('reads the home screen', () => {
    expect(shellRouteOf('/')).toEqual({ kind: 'home' });
  });

  it('reads a section', () => {
    expect(shellRouteOf('/portfolio')).toEqual({ kind: 'section', section: 'portfolio' });
  });

  it('reads the general conversation', () => {
    expect(shellRouteOf('/c')).toEqual({ kind: 'topic', topic: 'broker' });
  });

  it('reads a talk started from the home screen', () => {
    expect(shellRouteOf('/c/42')).toEqual({ kind: 'topic', topic: 'talk-42' });
  });

  it('reads a market topic by its ticker', () => {
    expect(shellRouteOf('/m/GOLD')).toEqual({ kind: 'topic', topic: 'GOLD' });
  });

  it('counts the broker instructions as a page of the settings', () => {
    expect(shellRouteOf('/settings/instructions')).toEqual({ kind: 'section', section: 'settings' });
  });

  it('no longer knows a section of the broker', () => {
    expect(shellRouteOf('/broker')).toEqual({ kind: 'other' });
  });

  it('leaves a thread link and unknown paths alone', () => {
    expect([shellRouteOf('/t/abc'), shellRouteOf('/nowhere')]).toEqual([
      { kind: 'other' },
      { kind: 'other' },
    ]);
  });
});

describe('isConversationPath', () => {
  it('knows the conversations from the pages around them', () => {
    expect(['/c', '/c/42', '/m/GOLD', '/t/7', '/', '/markets', '/chats'].map(isConversationPath)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});
