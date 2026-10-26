import { decimalSchema, positiveDecimalSchema } from '@reinforce/harness-contract';
import { z } from 'zod';

export const openFillSchema = z.object({
  at: z.number(),
  referencePrice: positiveDecimalSchema,
  price: positiveDecimalSchema,
  amount: positiveDecimalSchema,
  quantity: positiveDecimalSchema,
  fee: decimalSchema,
  stop: positiveDecimalSchema,
  target: positiveDecimalSchema,
  candleRevision: z.string(),
  rules: z.object({ version: z.string(), feeRate: decimalSchema, slippageBps: z.number() }),
});
