import { preferencesSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import type { Deps } from './deps.js';

// Patch validation must not insert defaults for fields the user did not edit.
const patchSchema = z
  .strictObject({
    ...preferencesSchema.shape,
    mode: preferencesSchema.shape.mode.removeDefault(),
    analysisLimit: preferencesSchema.shape.analysisLimit.removeDefault(),
    ideaLimit: preferencesSchema.shape.ideaLimit.removeDefault(),
    actionableOnly: preferencesSchema.shape.actionableOnly.removeDefault(),
  })
  .partial();
/** A person has one personal broker; it is found from the account, so a guest made a moment ago can set it up. */
export const preferencesInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('patch'), patch: patchSchema }),
  z.strictObject({ kind: z.literal('watch'), markets: preferencesSchema.shape.markets, on: z.boolean() }),
]);

export async function changePreferences(
  deps: Deps,
  userId: string,
  input: z.infer<typeof preferencesInputSchema>,
) {
  const personal = await broker.findBroker(deps.db, userId);
  if (!personal) return { kind: 'rejected', reason: 'not-found' } as const;
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'broker', personal.id);
    const current = (await broker.loadHead(tx, personal.id)).preferences;
    const next = preferencesSchema.safeParse(
      input.kind === 'patch'
        ? { ...current, ...input.patch }
        : {
            ...current,
            markets: input.on
              ? [...new Set([...current.markets, ...input.markets])]
              : current.markets.filter((id) => !input.markets.includes(id)),
          },
    );
    if (!next.success) return { kind: 'rejected', reason: 'invalid-preferences' } as const;
    await broker.setPreferences(tx, personal.id, next.data);
    const chat = await conversation.ensureConversation(tx, userId, personal.id, 'broker');
    await conversation.appendEntry(tx, {
      id: newId(),
      conversationId: chat.id,
      kind: 'preferences',
      sourceId: newId(),
      body: { preferences: next.data },
      createdAt: deps.clock.now(),
    });
    return { kind: 'saved', brokerId: personal.id } as const;
  });
}
