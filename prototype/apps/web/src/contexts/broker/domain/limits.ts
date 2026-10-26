import { versionInputSchema } from '@reinforce/server/dto';

const { prompt, note } = versionInputSchema.shape;

export const PROMPT_LENGTH = { min: prompt.minLength ?? 0, max: prompt.maxLength ?? undefined } as const;

export const NOTE_LENGTH = note.maxLength ?? undefined;
