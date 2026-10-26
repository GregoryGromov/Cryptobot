import { MAX_TRADE_USD, preferencesSchema } from '@reinforce/server/dto';

export type Bounds = { readonly min: number; readonly max: number };

const boundsOf = (schema: {
  readonly minValue: number | null;
  readonly maxValue: number | null;
}): Bounds => ({
  min: schema.minValue ?? 0,
  max: schema.maxValue ?? Number.MAX_SAFE_INTEGER,
});

const { ideaLimit, quiet } = preferencesSchema.shape;

export const IDEA_LIMIT = boundsOf(ideaLimit.removeDefault());

export const MAX_TRADE = MAX_TRADE_USD;

const hourBounds = boundsOf(quiet.shape.from);

export const HOURS: readonly number[] = Array.from(
  { length: hourBounds.max - hourBounds.min + 1 },
  (_, index) => hourBounds.min + index,
);
