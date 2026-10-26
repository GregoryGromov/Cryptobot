import * as z from 'zod/mini';
import { RACE_MODES } from './standings-vm';

export const leaderboardSearch = z.object({
  race: z.catch(z.optional(z.enum(RACE_MODES)), undefined),
});

export type LeaderboardSearch = z.infer<typeof leaderboardSearch>;
