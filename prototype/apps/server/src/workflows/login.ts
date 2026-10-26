import type { Locale } from '@reinforce/i18n/server';
import { z } from 'zod';
import { type XaiTokens, xaiIdentitySchema, xaiTokensSchema } from '../adapters/xai-auth.js';
import * as account from '../modules/account/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId, newToken, sha256 } from '../platform/identity.js';
import { secretBox } from '../platform/secrets.js';
import { createPersonalAccount } from './create-guest.js';
import type { Deps } from './deps.js';
import { keepOwnModel } from './own-model.js';

export class LoginFailure extends Error {
  readonly reason:
    | 'unavailable'
    | 'busy'
    | 'expired'
    | 'denied'
    | 'cancelled'
    | 'interrupted'
    | 'identity'
    | 'account-conflict'
    | 'session-changed';
  constructor(reason: LoginFailure['reason']) {
    super(`Login ${reason}`);
    this.reason = reason;
  }
}
export const loginAvailable = (deps: Deps): boolean =>
  Boolean(deps.xaiAuth && deps.config.XAI_CLIENT_ID && deps.config.SECRET_ENCRYPTION_KEY);
function services(deps: Deps) {
  if (!deps.xaiAuth || !deps.config.XAI_CLIENT_ID || !deps.config.SECRET_ENCRYPTION_KEY)
    throw new LoginFailure('unavailable');
  return {
    provider: deps.xaiAuth,
    clientId: deps.config.XAI_CLIENT_ID,
    box: secretBox(deps.config.SECRET_ENCRYPTION_KEY),
  };
}
function deviceView(attempt: account.LoginAttempt | undefined, now: number) {
  return attempt &&
    ['pending', 'polling', 'verifying'].includes(attempt.status) &&
    attempt.expiresAt > now &&
    attempt.userCode &&
    attempt.verificationUrl
    ? { userCode: attempt.userCode, url: attempt.verificationUrl, expiresAt: attempt.expiresAt }
    : null;
}
export async function pendingLogin(deps: Deps, sessionToken: string) {
  const attempt = await account.findLoginAttempt(deps.db, sha256(sessionToken));
  return {
    device: attempt?.clientId === deps.config.XAI_CLIENT_ID ? deviceView(attempt, deps.clock.now()) : null,
  };
}
const cleared = { deviceCipher: null, tokensCipher: null, operationId: null, leaseUntil: null };
async function closeAttempt(tx: Tx, attempt: account.LoginAttempt, reason: LoginFailure['reason']) {
  await account.updateLoginAttempt(tx, attempt.id, { ...cleared, status: 'failed', reason });
}

export async function startLogin(deps: Deps, sessionToken: string) {
  const { provider, clientId, box } = services(deps);
  const hash = sha256(sessionToken);
  const reserved = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', hash);
    const now = deps.clock.now();
    const prior = await account.findLoginAttempt(tx, hash);
    const publicDevice = deviceView(prior, now + 60_000);
    if (prior?.clientId === clientId && publicDevice)
      return { kind: 'existing', device: publicDevice } as const;
    if (prior?.status === 'starting' && (prior.leaseUntil ?? 0) > now) throw new LoginFailure('busy');
    await lock(tx, 'login-capacity', 'global');
    await account.purgeExpiredLogins(tx, now);
    const replacingActive =
      prior &&
      prior.expiresAt > now &&
      ['starting', 'pending', 'polling', 'verifying'].includes(prior.status);
    if (
      (await account.countActiveLogins(tx, now)) - (replacingActive ? 1 : 0) >=
      deps.config.AUTH_MAX_PENDING
    )
      throw new LoginFailure('busy');
    const initiator = await account.findSession(tx, hash, now);
    const attempt: account.LoginAttempt = {
      id: newId(),
      sessionHash: hash,
      initiatorUserId: initiator?.id ?? null,
      clientId,
      status: 'starting',
      deviceCipher: null,
      tokensCipher: null,
      userCode: null,
      verificationUrl: null,
      expiresAt: now + 60_000,
      intervalMs: 5000,
      nextPollAt: now,
      operationId: newId(),
      leaseUntil: now + 60_000,
      reason: null,
      createdAt: now,
    };
    await account.recordLoginAttempt(tx, attempt);
    return { kind: 'reserved', attempt } as const;
  });
  if (reserved.kind === 'existing') return reserved.device;
  let device: Awaited<ReturnType<typeof provider.start>>;
  try {
    device = await provider.start();
  } catch {
    await inTransaction(deps.db, async (tx) => {
      await lock(tx, 'session', hash);
      const current = await account.findLoginAttempt(tx, hash);
      if (current?.id === reserved.attempt.id && current.status === 'starting')
        await closeAttempt(tx, current, 'unavailable');
    });
    throw new LoginFailure('unavailable');
  }
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', hash);
    const current = await account.findLoginAttempt(tx, hash);
    const now = deps.clock.now();
    if (
      current?.id !== reserved.attempt.id ||
      current.status !== 'starting' ||
      (current.leaseUntil ?? 0) <= now
    )
      throw new LoginFailure('cancelled');
    const patch = {
      status: 'pending' as const,
      userCode: device.userCode,
      verificationUrl: device.url,
      deviceCipher: box.seal({ code: device.deviceCode }, `${current.id}:device`),
      expiresAt: current.createdAt + device.expiresIn * 1000,
      intervalMs: device.intervalMs,
      nextPollAt: now + device.intervalMs,
      operationId: null,
      leaseUntil: null,
    };
    await account.updateLoginAttempt(tx, current.id, patch);
    return { userCode: patch.userCode, url: patch.verificationUrl, expiresAt: patch.expiresAt };
  });
}

async function ownsAttempt(tx: Tx, attempt: account.LoginAttempt, now: number) {
  const current = await account.findLoginAttempt(tx, attempt.sessionHash);
  return current?.id === attempt.id &&
    current.operationId === attempt.operationId &&
    ['polling', 'verifying'].includes(current.status) &&
    current.expiresAt > now &&
    (current.leaseUntil ?? 0) > now
    ? current
    : null;
}
async function failClaim(deps: Deps, attempt: account.LoginAttempt, reason: LoginFailure['reason']) {
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', attempt.sessionHash);
    const current = await ownsAttempt(tx, attempt, deps.clock.now());
    if (current) await closeAttempt(tx, current, reason);
  });
}

export async function pollLogin(deps: Deps, sessionToken: string, locale: Locale) {
  const { provider, clientId, box } = services(deps);
  const hash = sha256(sessionToken);
  const prepared = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', hash);
    const now = deps.clock.now();
    const attempt = await account.findLoginAttempt(tx, hash);
    if (!attempt) {
      const user = await account.findSession(tx, hash, now);
      if (user && !user.guest) return { kind: 'connected' } as const;
      return { kind: 'failed', reason: 'expired' } as const;
    }
    if (attempt.status === 'connected') return { kind: 'failed', reason: 'session-changed' } as const;
    if (attempt.status === 'cancelled') return { kind: 'failed', reason: 'cancelled' } as const;
    if (attempt.status === 'failed') return { kind: 'failed', reason: 'denied' } as const;
    if (attempt.expiresAt <= now || attempt.clientId !== clientId) {
      await closeAttempt(tx, attempt, 'expired');
      return { kind: 'failed', reason: 'expired' } as const;
    }
    if (attempt.status === 'starting' || attempt.status === 'polling' || attempt.status === 'verifying') {
      if ((attempt.leaseUntil ?? 0) > now) return { kind: 'pending' } as const;
      if (attempt.status !== 'verifying' || !attempt.tokensCipher) {
        await closeAttempt(tx, attempt, 'interrupted');
        return { kind: 'failed', reason: 'interrupted' } as const;
      }
    } else if (attempt.nextPollAt > now) return { kind: 'pending' } as const;
    const claimed = {
      ...attempt,
      status: attempt.tokensCipher ? ('verifying' as const) : ('polling' as const),
      operationId: newId(),
      leaseUntil: now + 60_000,
    };
    await account.updateLoginAttempt(tx, attempt.id, claimed);
    return { kind: 'claimed', attempt: claimed } as const;
  });
  if (prepared.kind === 'failed') throw new LoginFailure(prepared.reason);
  if (prepared.kind === 'connected')
    return { status: 'connected', chat: 'broker', sessionToken: null } as const;
  if (prepared.kind === 'pending') return { status: 'pending' } as const;
  const attempt = prepared.attempt;
  let tokens: XaiTokens;
  try {
    if (attempt.tokensCipher)
      tokens = xaiTokensSchema.parse(box.open(attempt.tokensCipher, `${attempt.id}:tokens`));
    else {
      const device = z
        .object({ code: z.string().min(1) })
        .parse(box.open(attempt.deviceCipher ?? '', `${attempt.id}:device`));
      const result = await provider.poll(device.code).catch(() => ({ kind: 'unavailable' as const }));
      if (result.kind !== 'authorized') {
        await inTransaction(deps.db, async (tx) => {
          await lock(tx, 'session', hash);
          const current = await ownsAttempt(tx, attempt, deps.clock.now());
          if (!current) return;
          if (result.kind === 'denied' || result.kind === 'expired')
            await closeAttempt(tx, current, result.kind);
          else {
            const intervalMs = Math.min(
              3600_000,
              current.intervalMs +
                (result.kind === 'slow-down' ? 5000 : result.kind === 'unavailable' ? current.intervalMs : 0),
            );
            await account.updateLoginAttempt(tx, current.id, {
              status: 'pending',
              intervalMs,
              nextPollAt: deps.clock.now() + intervalMs,
              operationId: null,
              leaseUntil: null,
            });
          }
        });
        if (result.kind === 'denied' || result.kind === 'expired') throw new LoginFailure(result.kind);
        return { status: 'pending' } as const;
      }
      tokens = xaiTokensSchema.parse(result.tokens);
      const saved = await inTransaction(deps.db, async (tx) => {
        await lock(tx, 'session', hash);
        const current = await ownsAttempt(tx, attempt, deps.clock.now());
        if (!current) return false;
        await account.updateLoginAttempt(tx, current.id, {
          status: 'verifying',
          tokensCipher: box.seal(tokens, `${attempt.id}:tokens`),
          deviceCipher: null,
          leaseUntil: deps.clock.now() + 60_000,
        });
        return true;
      });
      if (!saved) throw new LoginFailure('cancelled');
    }
  } catch (error) {
    if (error instanceof LoginFailure) throw error;
    await failClaim(deps, attempt, 'identity');
    throw new LoginFailure('identity');
  }
  let identity: z.infer<typeof xaiIdentitySchema>;
  try {
    identity = xaiIdentitySchema.parse(await provider.verify(tokens, deps.clock.now()));
  } catch {
    await failClaim(deps, attempt, 'identity');
    throw new LoginFailure('identity');
  }
  const completed = await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', hash);
    const now = deps.clock.now();
    const current = await ownsAttempt(tx, attempt, now);
    if (!current) return { kind: 'failed', reason: 'cancelled' } as const;
    await lock(tx, 'identity', `xai:${identity.subject}`);
    let signedIn = await account.findSession(tx, hash, now);
    if (signedIn) {
      await lock(tx, 'account-user', signedIn.id);
      signedIn = await account.findSession(tx, hash, now);
    }
    if (
      (current.initiatorUserId !== null && signedIn?.id !== current.initiatorUserId) ||
      (current.initiatorUserId === null && signedIn && !signedIn.guest)
    ) {
      await closeAttempt(tx, current, 'session-changed');
      return { kind: 'failed', reason: 'session-changed' } as const;
    }
    let known = await account.findIdentity(tx, 'xai', identity.subject);
    if (signedIn && !signedIn.guest && known?.userId !== signedIn.id) {
      await closeAttempt(tx, current, 'account-conflict');
      return { kind: 'failed', reason: 'account-conflict' } as const;
    }
    let userId = known?.userId;
    if (!known) {
      if (signedIn?.guest) {
        const upgraded = await account.upgradeGuest(tx, signedIn.id, identity.name);
        if (!upgraded) throw new Error('Guest state changed under lock');
        userId = upgraded.id;
      } else
        userId = (await createPersonalAccount(deps, tx, { name: identity.name, guest: false, locale })).user
          .id;
      known = { id: newId(), userId, provider: 'xai', subject: identity.subject, createdAt: now };
      await account.recordIdentity(tx, known);
    }
    const nextToken = newToken();
    await account.revokeSession(tx, hash);
    await account.recordSession(tx, sha256(nextToken), known.userId, now + 30 * 86400000);
    await account.recordLogin(tx, {
      id: newId(),
      attemptId: current.id,
      userId: known.userId,
      identityId: known.id,
      createdAt: now,
    });
    await keepOwnModel(deps, tx, known.userId, identity.subject, tokens);
    await account.updateLoginAttempt(tx, current.id, {
      ...cleared,
      status: 'connected',
      userCode: null,
      verificationUrl: null,
      reason: null,
    });
    return { kind: 'connected', sessionToken: nextToken } as const;
  });
  if (completed.kind === 'failed') throw new LoginFailure(completed.reason);
  return { status: 'connected', chat: 'broker', sessionToken: completed.sessionToken } as const;
}

export async function cancelLogin(deps: Deps, sessionToken: string, logout = false) {
  const hash = sha256(sessionToken);
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'session', hash);
    const attempt = await account.findLoginAttempt(tx, hash);
    if (attempt)
      await account.updateLoginAttempt(tx, attempt.id, { ...cleared, status: 'cancelled', reason: null });
    if (logout) await account.revokeSession(tx, hash);
  });
  return { ok: true };
}
