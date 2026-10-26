import type { AnalysisProgress } from '@reinforce/server/dto';
import { match } from 'ts-pattern';

export type WaitStep = 'price' | 'volume' | 'indicators' | 'markets' | 'odds' | 'plan' | 'reasons';
export type StepState = 'pending' | 'active' | 'done';

type Stage = AnalysisProgress['stage'];

const READING = ['price', 'volume', 'indicators', 'markets'] as const;
// The broker gets the whole snapshot at once; its parts are told one by one while he reads it.
const READ_STEP_MS = 2_400;

const rank = (stage: Stage): number =>
  match(stage)
    .with('reading', () => 0)
    .with('odds', () => 1)
    .with('plan', () => 2)
    .with('reasons', () => 3)
    .exhaustive();

const byStage = (stage: Stage, own: Stage): StepState => {
  const delta = rank(stage) - rank(own);
  if (delta > 0) return 'done';
  return delta === 0 ? 'active' : 'pending';
};

const readState = (place: number, stage: Stage, elapsedMs: number): StepState => {
  if (stage !== 'reading') return 'done';
  const reached = Math.min(READING.length - 1, Math.floor(Math.max(0, elapsedMs) / READ_STEP_MS));
  if (place < reached) return 'done';
  return place === reached ? 'active' : 'pending';
};

/** What the broker is doing, step by step: the snapshot's parts while he reads it, then the stages he reports. */
export const waitSteps = (
  stage: Stage,
  elapsedMs: number,
): readonly { readonly step: WaitStep; readonly state: StepState }[] => [
  ...READING.map((step, place) => ({ step, state: readState(place, stage, elapsedMs) })),
  { step: 'odds', state: byStage(stage, 'odds') },
  { step: 'plan', state: byStage(stage, 'plan') },
  { step: 'reasons', state: byStage(stage, 'reasons') },
];
