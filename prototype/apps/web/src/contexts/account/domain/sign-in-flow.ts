import { match, P } from 'ts-pattern';

export type Device = { readonly userCode: string; readonly url: string; readonly expiresAt: number };

export type SignInFlow =
  | { readonly kind: 'closed' }
  | { readonly kind: 'starting' }
  | { readonly kind: 'waiting'; readonly device: Device }
  | { readonly kind: 'failed'; readonly reason: string };

export type SignInEvent =
  | { readonly kind: 'requested' }
  | { readonly kind: 'issued'; readonly device: Device }
  | { readonly kind: 'failed'; readonly reason: string }
  | { readonly kind: 'closed' };

export const CLOSED: SignInFlow = { kind: 'closed' };

export const signInStep = (flow: SignInFlow, event: SignInEvent): SignInFlow =>
  match<[SignInFlow, SignInEvent], SignInFlow>([flow, event])
    .with([P._, { kind: 'requested' }], () => ({ kind: 'starting' }))
    .with([P._, { kind: 'closed' }], () => CLOSED)
    .with([{ kind: 'starting' }, { kind: 'issued' }], ([, issued]) => ({
      kind: 'waiting',
      device: issued.device,
    }))
    .with([{ kind: P.union('closed', 'waiting', 'failed') }, { kind: 'issued' }], () => flow)
    .with([{ kind: P.union('starting', 'waiting') }, { kind: 'failed' }], ([, failed]) => ({
      kind: 'failed',
      reason: failed.reason,
    }))
    .with([{ kind: P.union('closed', 'failed') }, { kind: 'failed' }], () => flow)
    .exhaustive();

export const visibleFlow = (flow: SignInFlow, resumable: Device | null): SignInFlow =>
  flow.kind === 'closed' && resumable !== null ? { kind: 'waiting', device: resumable } : flow;
