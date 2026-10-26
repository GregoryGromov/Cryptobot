import { match, P } from 'ts-pattern';

export type ScrollMode = 'end' | 'turn' | 'free';

export type ScrollEvent =
  | { readonly type: 'opened'; readonly atEnd: boolean }
  | { readonly type: 'spoke' }
  | { readonly type: 'moved'; readonly atEnd: boolean }
  | { readonly type: 'jumped' }
  | { readonly type: 'revealed' }
  | { readonly type: 'held' };

export const nextScrollMode = (mode: ScrollMode, event: ScrollEvent): ScrollMode =>
  match([mode, event] as const)
    .returnType<ScrollMode>()
    .with([P._, { type: 'opened', atEnd: true }], () => 'end')
    .with([P._, { type: 'opened', atEnd: false }], () => 'free')
    .with([P._, { type: 'spoke' }], () => 'turn')
    .with([P._, { type: 'moved', atEnd: false }], () => 'free')
    .with(['free', { type: 'moved', atEnd: true }], () => 'end')
    .with([P.union('end', 'turn'), { type: 'moved', atEnd: true }], ([current]) => current)
    .with(['turn', { type: 'jumped' }], () => 'turn')
    .with([P.union('end', 'free'), { type: 'jumped' }], () => 'end')
    .with([P._, { type: 'revealed' }], () => 'free')
    .with(['end', { type: 'held' }], () => 'free')
    .with([P.union('turn', 'free'), { type: 'held' }], ([current]) => current)
    .exhaustive();

const NEAR_PX = 72;
export const GAP_PX = 16;
const GLIDE_FROM_PX = 120;

export const isAtEnd = (gap: number): boolean => gap < NEAR_PX;
export const isAway = (gap: number): boolean => gap > NEAR_PX * 2;

export const SPARE_PX = NEAR_PX * 2;

export type FollowStep =
  | { readonly kind: 'stay' }
  | { readonly kind: 'jump'; readonly top: number }
  | { readonly kind: 'glide'; readonly top: number }
  | { readonly kind: 'spare'; readonly top: number };

export const followStep = (
  mode: ScrollMode,
  view: {
    readonly top: number;
    readonly max: number;
    readonly arrived: number | null;
    readonly spare: number;
  },
): FollowStep => {
  if (mode !== 'end') return { kind: 'stay' };
  const target = view.arrived === null ? view.max : Math.min(view.max, view.arrived);
  const distance = target - view.top;
  if (distance > 1)
    return distance > GLIDE_FROM_PX ? { kind: 'glide', top: target } : { kind: 'jump', top: target };
  const more = view.max - view.top;
  return view.arrived !== null && more > 1 && more <= view.spare
    ? { kind: 'spare', top: view.max }
    : { kind: 'stay' };
};

export const roomFor = (view: {
  readonly saidTop: number;
  readonly viewport: number;
  readonly scrollHeight: number;
  readonly column: number;
}): { readonly need: number; readonly height: number } => {
  const need = Math.ceil(view.saidTop + view.viewport - view.scrollHeight);
  return { need, height: Math.max(0, view.column + need) };
};

export const glideMs = (distance: number): number => Math.min(560, Math.max(300, Math.abs(distance) * 0.6));

export const easeOut = (t: number): number => 1 - (1 - t) ** 4;

const FLOOR_SLACK_PX = 24;

export const passedFloor = (top: number, floor: number): boolean => top < floor - FLOOR_SLACK_PX;

export const clampScroll = (top: number, max: number): number => Math.max(0, Math.min(top, max));
