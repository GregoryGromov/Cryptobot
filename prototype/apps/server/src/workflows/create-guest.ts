import { type Locale, translator } from '@reinforce/i18n/server';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId, payloadHash, sha256 } from '../platform/identity.js';
import type { Deps } from './deps.js';

/** The caller supplies an unguessable session token; retries share its hash. */
export async function createGuest(deps: Deps, token: string, locale: Locale) {
  return inTransaction(deps.db, async (tx) => {
    const tokenHash = sha256(token);
    await lock(tx, 'session', tokenHash);
    const now = deps.clock.now();
    const prior = await account.findSession(tx, tokenHash, now);
    if (prior) return { user: prior, broker: await broker.findBroker(tx, prior.id) };
    // An expired session row can outlive its browser cookie. It no longer grants account access.
    await account.revokeSession(tx, tokenHash);
    const created = await createPersonalAccount(deps, tx, { name: '', guest: true, locale });
    await account.recordSession(tx, tokenHash, created.user.id, now + 30 * 86400000);
    return created;
  });
}

/** A guest has no name of its own; the page calls it one in its language. */
export async function createPersonalAccount(
  deps: Deps,
  tx: Tx,
  person: Pick<account.User, 'name' | 'guest' | 'locale'>,
) {
  const now = deps.clock.now();
  const t = translator(person.locale);
  const user: account.User = { id: newId(), ...person, createdAt: now };
  const personal: broker.Broker = { id: newId(), userId: user.id, template: 'reinforce-1', createdAt: now };
  const version: broker.BrokerVersion = {
    id: newId(),
    brokerId: personal.id,
    number: 1,
    prompt: t('broker.prompt'),
    model: deps.config.OPENROUTER_MODEL,
    route: 'platform',
    harness: 'builtin-1',
    note: t('broker.template'),
    requestId: newId(),
    inputHash: payloadHash({ template: 'reinforce-1', model: deps.config.OPENROUTER_MODEL }),
    createdAt: now,
  };
  await account.recordUser(tx, user);
  await broker.recordBroker(tx, personal, version, newId());
  await trading.createAccounts(tx, user.id, personal.id, now);
  const chat = await conversation.ensureConversation(tx, user.id, personal.id, 'broker');
  await conversation.appendEntry(tx, {
    id: newId(),
    conversationId: chat.id,
    kind: 'welcome',
    sourceId: personal.id,
    body: { text: t('chat.welcome'), role: 'broker' },
    createdAt: now,
  });
  return { user, broker: personal };
}
