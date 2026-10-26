import * as account from '../modules/account/index.js';
import { inTransaction, lock } from '../platform/db.js';
import { newToken, sha256 } from '../platform/identity.js';
import type { Deps } from './deps.js';

export const telegramAvailable = (deps: Deps): boolean =>
  Boolean(
    deps.config.TELEGRAM_BOT_TOKEN &&
      deps.config.TELEGRAM_BOT_USERNAME &&
      deps.config.TELEGRAM_WEBHOOK_SECRET,
  );
export async function linkTelegram(deps: Deps, userId: string) {
  if (!telegramAvailable(deps)) return { kind: 'rejected', reason: 'telegram-unavailable' } as const;
  const token = newToken();
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'telegram-user', userId);
    if (await account.findTelegramLink(tx, userId))
      return { kind: 'rejected', reason: 'telegram-already-linked' } as const;
    await account.revokeTelegramTokens(tx, userId);
    await account.recordTelegramToken(tx, {
      tokenHash: sha256(token),
      userId,
      expiresAt: deps.clock.now() + 10 * 60_000,
    });
    return { kind: 'link', url: `https://t.me/${deps.config.TELEGRAM_BOT_USERNAME}?start=${token}` } as const;
  });
}

export async function unlinkTelegram(deps: Deps, userId: string) {
  return inTransaction(deps.db, async (tx) => {
    // Receive and send also take this lock before checking the current link.
    await lock(tx, 'telegram-user', userId);
    await account.deleteTelegramLink(tx, userId);
    await account.revokeTelegramTokens(tx, userId);
    return { ok: true } as const;
  });
}
