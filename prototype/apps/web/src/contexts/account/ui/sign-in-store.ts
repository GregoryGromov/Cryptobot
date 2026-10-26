import { create } from 'zustand';
import {
  CLOSED,
  type Device,
  type SignInEvent,
  type SignInFlow,
  signInStep,
  visibleFlow,
} from '../domain/sign-in-flow';

type SignInActions = {
  readonly stepped: (event: SignInEvent, resumable: Device | null) => void;
};

type SignInStore = {
  readonly flow: SignInFlow;
  readonly actions: SignInActions;
};

export const useSignInStore = create<SignInStore>()((set) => ({
  flow: CLOSED,
  actions: {
    stepped: (event, resumable) =>
      set((state) => ({ flow: signInStep(visibleFlow(state.flow, resumable), event) })),
  },
}));

export const useSignInFlow = (): SignInFlow => useSignInStore((state) => state.flow);
export const useSignInActions = (): SignInActions => useSignInStore((state) => state.actions);
