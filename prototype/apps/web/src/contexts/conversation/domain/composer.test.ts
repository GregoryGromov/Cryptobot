import { describe, expect, it } from 'vitest';
import type { Asset } from './chat-types';
import {
  type ComposerState,
  composeIntent,
  composerReducer,
  EMPTY_COMPOSER,
  homeRoute,
  isComposing,
  messageText,
  topicRoute,
} from './composer';

const gold: Asset = { key: 'xyz:GOLD', coin: 'xyz:GOLD', name: 'Gold', ticker: 'GOLD', cls: 'commodities' };

const typed = (text: string): ComposerState => composerReducer(EMPTY_COMPOSER, { type: 'typed', text });

describe('messageText', () => {
  it('puts the asset code before the words', () => {
    expect(messageText('что будет?', gold)).toBe('$GOLD что будет?');
  });

  it('sends the code alone when nothing was typed', () => {
    expect(messageText('   ', gold)).toBe('$GOLD');
  });
});

describe('composeIntent', () => {
  it('says nothing for an empty field', () => {
    expect(composeIntent(typed('  '), 'r1')).toBeNull();
  });

  it('takes a fresh request id for new words', () => {
    expect(composeIntent(typed('Привет'), 'r1')?.requestId).toBe('r1');
  });

  it('keeps the request id when the same words are sent again after a failure', () => {
    const sent = composerReducer(typed('Привет'), {
      type: 'sent',
      intent: { requestId: 'r1', text: 'Привет', typed: 'Привет', asset: null },
    });
    const failed = composerReducer(sent, { type: 'failed' });
    expect(composeIntent(failed, 'r2')?.requestId).toBe('r1');
  });

  it('takes a new request id once the words were changed', () => {
    const sent = composerReducer(typed('Привет'), {
      type: 'sent',
      intent: { requestId: 'r1', text: 'Привет', typed: 'Привет', asset: null },
    });
    const edited = composerReducer(composerReducer(sent, { type: 'failed' }), {
      type: 'typed',
      text: 'Здравствуйте',
    });
    expect(composeIntent(edited, 'r2')?.requestId).toBe('r2');
  });
});

describe('composerReducer', () => {
  const intent = { requestId: 'r1', text: '$GOLD что будет?', typed: 'что будет?', asset: gold };

  it('empties the field the moment the words go', () => {
    const state = composerReducer(typed('что будет?'), { type: 'sent', intent });
    expect({ text: state.text, asset: state.asset }).toEqual({ text: '', asset: null });
  });

  it('gives the words and the asset back when the server did not take them', () => {
    const state = composerReducer(composerReducer(typed('что будет?'), { type: 'sent', intent }), {
      type: 'failed',
    });
    expect({ text: state.text, asset: state.asset?.key }).toEqual({ text: 'что будет?', asset: 'xyz:GOLD' });
  });

  it('keeps what was typed since rather than giving the old words back', () => {
    const sent = composerReducer(typed('что будет?'), { type: 'sent', intent });
    const state = composerReducer(composerReducer(sent, { type: 'typed', text: 'и ещё' }), {
      type: 'failed',
    });
    expect(state.text).toBe('и ещё');
  });

  it('forgets the request once the server took it', () => {
    const state = composerReducer(composerReducer(typed('что будет?'), { type: 'sent', intent }), {
      type: 'delivered',
    });
    expect({ inflight: state.inflight, held: state.held }).toEqual({ inflight: null, held: null });
  });

  it('drops the asset tag on its own', () => {
    const state = composerReducer(composerReducer(EMPTY_COMPOSER, { type: 'picked', asset: gold }), {
      type: 'unpicked',
    });
    expect(state.asset).toBeNull();
  });
});

describe('topicRoute', () => {
  it('sends words to the topic they were typed in', () => {
    expect(topicRoute('talk-a', false, null)).toEqual({ kind: 'send' });
  });

  it('asks for an analysis in a market not analysed yet', () => {
    expect(topicRoute('BTC', true, null)).toEqual({ kind: 'analyze', instrument: 'BTC', here: true });
  });

  it('analyses another market in its own topic', () => {
    expect(topicRoute('BTC', false, gold)).toEqual({ kind: 'analyze', instrument: 'xyz:GOLD', here: false });
  });

  it('analyses the market of the topic in place when its asset is chosen', () => {
    expect(topicRoute('xyz:GOLD', false, gold)).toEqual({
      kind: 'analyze',
      instrument: 'xyz:GOLD',
      here: true,
    });
  });
});

describe('homeRoute', () => {
  it('starts a talk from words alone', () => {
    expect(homeRoute(null)).toEqual({ kind: 'start' });
  });

  it('analyses the chosen market', () => {
    expect(homeRoute(gold)).toEqual({ kind: 'analyze', asset: gold });
  });
});

describe('isComposing', () => {
  it('treats Enter during an IME composition as part of it', () => {
    expect(isComposing({ isComposing: false, keyCode: 229 })).toBe(true);
  });

  it('treats a plain Enter as sending', () => {
    expect(isComposing({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});
