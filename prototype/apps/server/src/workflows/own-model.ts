import { z } from 'zod';
import { ModelFailure } from '../adapters/model.js';
import { XaiAuthFailure, type XaiTokens } from '../adapters/xai-auth.js';
import type { OwnModelAuth } from '../adapters/xai-model.js';
import * as account from '../modules/account/index.js';
import { type Db, inTransaction, lock, type Tx } from '../platform/db.js';
import { secretBox } from '../platform/secrets.js';
import type { Deps } from './deps.js';

type OwnDeps = Pick<Deps, 'db' | 'clock' | 'config'> & Partial<Pick<Deps, 'xaiAuth' | 'ownModel'>>;

/** Tokens are renewed this long before they run out, so a call never starts on one about to expire. */
const EXPIRY_MARGIN_MS = 60_000;
const sealedSchema = z.object({ access: z.string().min(1), refresh: z.string().min(1) });
const context = (userId: string) => `own-model:${userId}`;

/** The deployment lets a signed-in user's own Grok answer: the switch is on and everything it needs is there. */
export const ownModelAvailable = (deps: OwnDeps): boolean =>
  deps.config.XAI_OWN_MODEL === 'on' &&
  Boolean(deps.ownModel && deps.xaiAuth?.refresh && deps.config.SECRET_ENCRYPTION_KEY);

/** Keeps the tokens of a sign-in for the user's own model. A sign-in that brought no refresh token keeps nothing. */
export async function keepOwnModel(
  deps: OwnDeps,
  tx: Tx,
  userId: string,
  subject: string,
  tokens: XaiTokens,
) {
  if (!ownModelAvailable(deps) || !deps.config.SECRET_ENCRYPTION_KEY || !tokens.refresh_token) return;
  const now = deps.clock.now();
  const prior = await account.findModelCredential(tx, userId);
  await account.saveModelCredential(tx, {
    userId,
    provider: 'xai',
    subject,
    cipher: secretBox(deps.config.SECRET_ENCRYPTION_KEY).seal(
      { access: tokens.access_token, refresh: tokens.refresh_token },
      context(userId),
    ),
    expiresAt: now + (tokens.expires_in ?? 3600) * 1000,
    // A choice of the platform's model made before signing in again stays.
    active: prior?.active ?? true,
    updatedAt: now,
  });
}

/** Whose model answers a user: their own when it is connected and chosen, the platform's otherwise. */
export async function ownModelChosen(deps: OwnDeps, db: Db, userId: string): Promise<boolean> {
  if (!ownModelAvailable(deps)) return false;
  return (await account.findModelCredential(db, userId))?.active === true;
}

/**
 * The user's tokens for one call, renewed when they are about to run out. Renewal holds the user's lock: xAI rotates
 * refresh tokens, and two renewals at once would leave one of them with a spent token. A sign-in xAI no longer
 * honours is forgotten: the user connects again.
 */
export async function ownModelAccess(deps: OwnDeps, userId: string): Promise<OwnModelAuth> {
  const key = deps.config.SECRET_ENCRYPTION_KEY;
  const refresh = deps.xaiAuth?.refresh;
  if (!key || !refresh) throw new ModelFailure('refused');
  const box = secretBox(key);
  const result = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'own-model', userId);
    const row = await account.findModelCredential(tx, userId);
    if (!row) return { kind: 'missing' } as const;
    const sealed = sealedSchema.parse(box.open(row.cipher, context(userId)));
    const now = deps.clock.now();
    if (row.expiresAt >= now + EXPIRY_MARGIN_MS)
      return { kind: 'ready', auth: { accessToken: sealed.access, subject: row.subject } } as const;
    let tokens: XaiTokens;
    try {
      tokens = await refresh(sealed.refresh);
    } catch (error) {
      if (!(error instanceof XaiAuthFailure) || error.kind !== 'refused')
        return { kind: 'unavailable' } as const;
      await account.deleteModelCredential(tx, userId);
      return { kind: 'missing' } as const;
    }
    await account.updateModelCredential(tx, userId, {
      cipher: box.seal(
        { access: tokens.access_token, refresh: tokens.refresh_token ?? sealed.refresh },
        context(userId),
      ),
      expiresAt: now + (tokens.expires_in ?? 3600) * 1000,
      updatedAt: now,
    });
    return { kind: 'ready', auth: { accessToken: tokens.access_token, subject: row.subject } } as const;
  });
  if (result.kind === 'ready') return result.auth;
  throw new ModelFailure(result.kind === 'missing' ? 'refused' : 'unavailable');
}

/** The user's choice between their own model and the platform's. Without a connected one there is nothing to choose. */
export async function chooseOwnModel(deps: OwnDeps, userId: string, own: boolean) {
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'own-model', userId);
    const row = await account.findModelCredential(tx, userId);
    if (!row || !ownModelAvailable(deps)) return { kind: 'rejected', reason: 'not-connected' } as const;
    await account.updateModelCredential(tx, userId, { active: own, updatedAt: deps.clock.now() });
    return { kind: 'chosen', route: own ? 'own' : 'free' } as const;
  });
}

/** Forgets the user's own model: the kept tokens are deleted, the platform's model answers from then on. */
export async function forgetOwnModel(deps: OwnDeps, userId: string) {
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'own-model', userId);
    await account.deleteModelCredential(tx, userId);
  });
  return { ok: true } as const;
}
