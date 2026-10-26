import { match } from 'ts-pattern';
import { assetCode } from '~/shared/routing/topics';
import type { Asset } from './chat-types';

export type Intent = {
  readonly requestId: string;
  readonly text: string;
  readonly typed: string;
  readonly asset: Asset | null;
};

export type ComposerState = {
  readonly text: string;
  readonly asset: Asset | null;
  readonly inflight: Intent | null;
  readonly held: Intent | null;
};

export type ComposerEvent =
  | { readonly type: 'typed'; readonly text: string }
  | { readonly type: 'picked'; readonly asset: Asset }
  | { readonly type: 'unpicked' }
  | { readonly type: 'sent'; readonly intent: Intent }
  | { readonly type: 'delivered' }
  | { readonly type: 'failed' };

export const EMPTY_COMPOSER: ComposerState = { text: '', asset: null, inflight: null, held: null };

const sameAsset = (a: Asset | null, b: Asset | null): boolean => (a?.key ?? null) === (b?.key ?? null);

export const messageText = (typed: string, asset: Asset | null): string => {
  const words = typed.trim();
  if (!asset) return words;
  const code = assetCode(asset.ticker);
  return words ? `${code} ${words}` : code;
};

export const composeIntent = (state: ComposerState, freshId: string): Intent | null => {
  const text = messageText(state.text, state.asset);
  if (!text) return null;
  const held = state.held;
  const again = held !== null && held.text === text && sameAsset(held.asset, state.asset);
  return { requestId: again ? held.requestId : freshId, text, typed: state.text, asset: state.asset };
};

export const composerReducer = (state: ComposerState, event: ComposerEvent): ComposerState =>
  match(event)
    .with({ type: 'typed' }, ({ text }) => ({ ...state, text }))
    .with({ type: 'picked' }, ({ asset }) => ({ ...state, asset }))
    .with({ type: 'unpicked' }, () => ({ ...state, asset: null }))
    .with({ type: 'sent' }, ({ intent }) => ({ ...state, text: '', asset: null, inflight: intent }))
    .with({ type: 'delivered' }, () => ({ ...state, inflight: null, held: null }))
    .with({ type: 'failed' }, () => {
      const lost = state.inflight;
      if (lost === null) return state;
      const untouched = state.text === '' && state.asset === null;
      return untouched
        ? { text: lost.typed, asset: lost.asset, inflight: null, held: lost }
        : { ...state, inflight: null, held: lost };
    })
    .exhaustive();

export type TopicRoute =
  | { readonly kind: 'send' }
  | { readonly kind: 'analyze'; readonly instrument: string; readonly here: boolean };

export const topicRoute = (topic: string, analyzeFirst: boolean, asset: Asset | null): TopicRoute => {
  if (asset) return { kind: 'analyze', instrument: asset.key, here: asset.key === topic };
  if (analyzeFirst) return { kind: 'analyze', instrument: topic, here: true };
  return { kind: 'send' };
};

export type HomeRoute = { readonly kind: 'start' } | { readonly kind: 'analyze'; readonly asset: Asset };

export const homeRoute = (asset: Asset | null): HomeRoute =>
  asset ? { kind: 'analyze', asset } : { kind: 'start' };

export const isComposing = (event: { readonly isComposing: boolean; readonly keyCode: number }): boolean =>
  event.isComposing || event.keyCode === 229;
