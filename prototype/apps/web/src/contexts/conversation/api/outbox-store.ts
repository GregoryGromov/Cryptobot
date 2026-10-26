import { create } from 'zustand';
import { type OutboxEvent, outboxReducer, type Said } from '../domain/outbox';

type OutboxStore = {
  readonly boxes: Readonly<Record<string, readonly Said[]>>;
  readonly actions: { readonly told: (topic: string, event: OutboxEvent) => void };
};

const EMPTY: readonly Said[] = [];

// Outlives the page: a request made on one page is already waiting in the conversation it opens.
const useOutboxStore = create<OutboxStore>()((set) => ({
  boxes: {},
  actions: {
    told: (topic, event) =>
      set((state) => ({
        boxes: { ...state.boxes, [topic]: outboxReducer(state.boxes[topic] ?? EMPTY, event) },
      })),
  },
}));

export const useOutbox = (topic: string): readonly Said[] =>
  useOutboxStore((state) => state.boxes[topic] ?? EMPTY);

export const tellOutbox = (topic: string, event: OutboxEvent): void =>
  useOutboxStore.getState().actions.told(topic, event);
