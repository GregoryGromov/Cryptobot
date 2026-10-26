import type { Locale } from '@reinforce/i18n';
import { bigint, boolean, pgSchema, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const account = pgSchema('account');
export const loginAttempts = account.table('login_attempts', {
  id: uuid().primaryKey(),
  sessionHash: text('session_hash').notNull().unique(),
  initiatorUserId: uuid('initiator_user_id'),
  clientId: text('client_id').notNull(),
  status: text()
    .$type<'starting' | 'pending' | 'polling' | 'verifying' | 'connected' | 'failed' | 'cancelled'>()
    .notNull(),
  deviceCipher: text('device_cipher'),
  tokensCipher: text('tokens_cipher'),
  userCode: text('user_code'),
  verificationUrl: text('verification_url'),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  intervalMs: bigint('interval_ms', { mode: 'number' }).notNull(),
  nextPollAt: bigint('next_poll_at', { mode: 'number' }).notNull(),
  operationId: uuid('operation_id'),
  leaseUntil: bigint('lease_until', { mode: 'number' }),
  reason: text(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const logins = account.table('logins', {
  id: uuid().primaryKey(),
  attemptId: uuid('attempt_id').notNull().unique(),
  userId: uuid('user_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const telegramTokens = account.table('telegram_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});
export const telegramLinks = account.table('telegram_links', {
  id: uuid().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  subject: bigint({ mode: 'number' }).notNull().unique(),
  username: text(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const telegramUpdates = account.table('telegram_updates', {
  updateId: bigint('update_id', { mode: 'number' }).primaryKey(),
  bodyHash: text('body_hash').notNull(),
  outcome: text().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const users = account.table('users', {
  id: uuid().primaryKey(),
  name: text().notNull(),
  guest: boolean().notNull(),
  locale: text().$type<Locale>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const sessions = account.table('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});
/** A user's own model: the sealed xAI tokens their Grok is called with; see migration 0018. */
export const modelCredentials = account.table('model_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  provider: text().$type<'xai'>().notNull(),
  subject: text().notNull(),
  cipher: text().notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  active: boolean().notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
export const identities = account.table(
  'identities',
  {
    id: uuid().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    provider: text().notNull(),
    subject: text().notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('identity_provider_subject').on(t.provider, t.subject)],
);
