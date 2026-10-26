import { create } from 'zustand';
import { AGENTS, type AgentKey, type Trust } from '~/shared/api/mock/agents';

type AgentState = {
  readonly stopped: Partial<Record<AgentKey, boolean>>;
  readonly trust: Partial<Record<AgentKey, Trust>>;
  readonly staked: boolean;
  readonly actions: {
    readonly stopToggled: (agent: AgentKey) => void;
    readonly allStopped: () => void;
    readonly allResumed: () => void;
    readonly trustChosen: (agent: AgentKey, trust: Trust) => void;
    readonly stakeToggled: () => void;
  };
};

const useAgentStore = create<AgentState>()((set) => ({
  stopped: {},
  trust: {},
  staked: false,
  actions: {
    stopToggled: (agent) => set((state) => ({ stopped: { ...state.stopped, [agent]: !state.stopped[agent] } })),
    allStopped: () => set({ stopped: Object.fromEntries(AGENTS.map((agent) => [agent.key, true])) }),
    allResumed: () => set({ stopped: {} }),
    trustChosen: (agent, trust) => set((state) => ({ trust: { ...state.trust, [agent]: trust } })),
    stakeToggled: () =>
      set((state) => ({
        staked: !state.staked,
        trust: state.staked
          ? Object.fromEntries(Object.entries(state.trust).filter(([, trust]) => trust !== 'transfer'))
          : state.trust,
      })),
  },
}));

export const useAgentStopped = (agent: AgentKey): boolean => useAgentStore((state) => state.stopped[agent] ?? false);

export const useAllStopped = (): boolean =>
  useAgentStore((state) => AGENTS.every((agent) => state.stopped[agent.key] ?? false));

export const useAgentTrust = (agent: AgentKey): Trust | undefined => useAgentStore((state) => state.trust[agent]);

export const useAgentStaked = (): boolean => useAgentStore((state) => state.staked);

export const useAgentActions = () => useAgentStore((state) => state.actions);
