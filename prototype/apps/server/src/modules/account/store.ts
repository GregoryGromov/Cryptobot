import { and, count, eq, gt, inArray, lt } from 'drizzle-orm';
import type { Db, Tx } from '../../platform/db.js';
import {
  identities,
  loginAttempts,
  logins,
  modelCredentials,
  sessions,
  telegramLinks,
  telegramTokens,
  telegramUpdates,
  users,
} from './schema.js';
export type User = typeof users.$inferSelect;
export async function findUser(db: Db, id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}
export const recordUser = async (tx: Tx, user: User) => {
  await tx.insert(users).values(user);
};
export const setUserLocale = async (tx: Tx, userId: string, locale: User['locale']) => {
  await tx.update(users).set({ locale }).where(eq(users.id, userId));
};
export const upgradeGuest = async (tx: Tx, userId: string, name: string) => {
  const [user] = await tx
    .update(users)
    .set({ guest: false, name })
    .where(and(eq(users.id, userId), eq(users.guest, true)))
    .returning();
  return user;
};
export const recordIdentity = async (tx: Tx, value: typeof identities.$inferInsert) => {
  await tx.insert(identities).values(value);
};
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export const findLoginAttempt = async (db: Db, sessionHash: string) =>
  (await db.select().from(loginAttempts).where(eq(loginAttempts.sessionHash, sessionHash)))[0];
export const recordLoginAttempt = async (tx: Tx, value: LoginAttempt) => {
  await tx
    .insert(loginAttempts)
    .values(value)
    .onConflictDoUpdate({ target: loginAttempts.sessionHash, set: value });
};
export const updateLoginAttempt = async (
  tx: Tx,
  id: string,
  patch: Partial<Omit<LoginAttempt, 'id' | 'sessionHash'>>,
) => {
  await tx.update(loginAttempts).set(patch).where(eq(loginAttempts.id, id));
};
export const countActiveLogins = async (db: Db, now: number) => {
  const [row] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(
      and(
        gt(loginAttempts.expiresAt, now),
        inArray(loginAttempts.status, ['starting', 'pending', 'polling', 'verifying']),
      ),
    );
  return row?.n ?? 0;
};
export const purgeExpiredLogins = async (tx: Tx, before: number) => {
  await tx.delete(loginAttempts).where(lt(loginAttempts.expiresAt, before));
};
export const recordLogin = async (tx: Tx, value: typeof logins.$inferInsert) => {
  await tx.insert(logins).values(value);
};
export const recordSession = async (tx: Tx, tokenHash: string, userId: string, expiresAt: number) => {
  await tx.insert(sessions).values({ tokenHash, userId, expiresAt });
};
export async function findSession(db: Db, tokenHash: string, now: number): Promise<User | undefined> {
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)));
  return row?.user;
}
export const revokeSession = async (tx: Tx, tokenHash: string) => {
  await tx.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
};
export const findIdentity = async (db: Db, provider: string, subject: string) => {
  const [row] = await db
    .select()
    .from(identities)
    .where(and(eq(identities.provider, provider), eq(identities.subject, subject)));
  return row;
};

export type TelegramLink = typeof telegramLinks.$inferSelect;
export const findTelegramLink = async (db: Db, userId: string) =>
  (await db.select().from(telegramLinks).where(eq(telegramLinks.userId, userId)))[0];
export const findTelegramSubject = async (db: Db, subject: number) =>
  (await db.select().from(telegramLinks).where(eq(telegramLinks.subject, subject)))[0];
export const findTelegramLinkById = async (db: Db, id: string) =>
  (await db.select().from(telegramLinks).where(eq(telegramLinks.id, id)))[0];
export const listTelegramLinks = (db: Db) => db.select().from(telegramLinks);
export const recordTelegramLink = async (tx: Tx, value: TelegramLink) => {
  await tx.insert(telegramLinks).values(value);
};
export const deleteTelegramLink = async (tx: Tx, userId: string) => {
  await tx.delete(telegramLinks).where(eq(telegramLinks.userId, userId));
};
export const revokeTelegramTokens = async (tx: Tx, userId: string) => {
  await tx.delete(telegramTokens).where(eq(telegramTokens.userId, userId));
};
export const recordTelegramToken = async (tx: Tx, value: typeof telegramTokens.$inferInsert) => {
  await tx.insert(telegramTokens).values(value);
};
export const findTelegramToken = async (db: Db, tokenHash: string) =>
  (await db.select().from(telegramTokens).where(eq(telegramTokens.tokenHash, tokenHash)))[0];
export const findTelegramUpdate = async (db: Db, updateId: number) =>
  (await db.select().from(telegramUpdates).where(eq(telegramUpdates.updateId, updateId)))[0];
export const recordTelegramUpdate = async (tx: Tx, value: typeof telegramUpdates.$inferInsert) => {
  await tx.insert(telegramUpdates).values(value);
};
export type ModelCredential = typeof modelCredentials.$inferSelect;
export const findModelCredential = async (db: Db, userId: string) =>
  (await db.select().from(modelCredentials).where(eq(modelCredentials.userId, userId)))[0];
export const saveModelCredential = async (tx: Tx, value: ModelCredential) => {
  await tx
    .insert(modelCredentials)
    .values(value)
    .onConflictDoUpdate({ target: modelCredentials.userId, set: value });
};
export const updateModelCredential = async (
  tx: Tx,
  userId: string,
  patch: Partial<Omit<ModelCredential, 'userId'>>,
) => {
  await tx.update(modelCredentials).set(patch).where(eq(modelCredentials.userId, userId));
};
export const deleteModelCredential = async (tx: Tx, userId: string) => {
  await tx.delete(modelCredentials).where(eq(modelCredentials.userId, userId));
};
