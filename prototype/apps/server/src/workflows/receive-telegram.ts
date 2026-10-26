import { FALLBACK_LOCALE, known, type Locale, matchLocale, translator } from '@reinforce/i18n/server';
import { z } from 'zod';
import { type TelegramPayload, telegramUpdateSchema } from '../adapters/telegram.js';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId, payloadHash, sha256 } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import { confirmProposalInTransaction } from './confirm-proposal.js';
import type { Deps } from './deps.js';
import { sendMessageInTransaction } from './send-message.js';

async function reply(deps: Deps, tx: Tx, linkId: string, updateId: number, payload: TelegramPayload) {
  const id = newId();
  await conversation.recordTelegramDelivery(tx, {
    id,
    linkId,
    sourceId: `update:${updateId}`,
    status: 'pending',
    payload,
    createdAt: deps.clock.now(),
  });
  await enqueue(deps.jobs, tx, 'notification.send', id);
}

export async function receiveTelegram(deps: Deps, raw: unknown) {
  const update = telegramUpdateSchema.parse(raw);
  const bodyHash = payloadHash(update);
  return inTransaction(deps.db, async (tx) => {
    await lock(tx, 'telegram-update', String(update.update_id));
    const previous = await account.findTelegramUpdate(tx, update.update_id);
    if (previous)
      return {
        outcome: previous.bodyHash === bodyHash ? previous.outcome : 'conflict',
        replayed: true,
        webhookReply: null,
      };
    // The account's language once it is known; before that, the one of the person's Telegram.
    let locale: Locale = FALLBACK_LOCALE;
    const speak = async (userId: string) => {
      locale = (await account.findUser(tx, userId))?.locale ?? locale;
      return translator(locale);
    };
    const finish = async (outcome: string) => {
      await account.recordTelegramUpdate(tx, {
        updateId: update.update_id,
        bodyHash,
        outcome,
        createdAt: deps.clock.now(),
      });
      const message = update.message;
      const text = known(translator(locale)('telegram.feedback', { returnObjects: true }), outcome);
      // Generic service acknowledgements need no message mapping. Telegram executes the webhook reply
      // after commit; delivery is best effort and carries no personal information.
      const webhookReply =
        text &&
        message?.from &&
        !message.from.is_bot &&
        message.chat.type === 'private' &&
        message.chat.id === message.from.id
          ? { method: 'sendMessage', chat_id: message.chat.id, text }
          : null;
      return { outcome, replayed: false, webhookReply };
    };
    const callback = update.callback_query;
    const msg = callback?.message ?? update.message;
    const from = callback?.from ?? msg?.from;
    if (!from || from.is_bot || !msg || msg.chat.type !== 'private' || msg.chat.id !== from.id)
      return finish('ignored');
    await lock(tx, 'telegram-subject', String(from.id));
    locale = matchLocale(from.language_code ? [from.language_code] : []) ?? FALLBACK_LOCALE;

    const startToken = !callback ? /^\/start ([A-Za-z0-9_-]{43})$/.exec(msg.text ?? '')?.[1] : undefined;
    if (startToken) {
      const token = await account.findTelegramToken(tx, sha256(startToken));
      if (!token) return finish('invalid-link');
      await lock(tx, 'telegram-user', token.userId);
      const currentToken = await account.findTelegramToken(tx, sha256(startToken));
      if (!currentToken || currentToken.expiresAt <= deps.clock.now()) return finish('invalid-link');
      if (
        (await account.findTelegramSubject(tx, from.id)) ||
        (await account.findTelegramLink(tx, token.userId))
      )
        return finish('already-linked');
      const link = {
        id: newId(),
        userId: token.userId,
        subject: from.id,
        username: from.username ?? null,
        createdAt: deps.clock.now(),
      };
      await account.recordTelegramLink(tx, link);
      await account.revokeTelegramTokens(tx, token.userId);
      // Start at the current journal boundary, so linking never dumps the old history.
      for (const chat of await conversation.listConversations(tx, token.userId))
        await conversation.setTelegramCursor(tx, link.id, chat.id, chat.nextSeq - 1);
      await reply(deps, tx, link.id, update.update_id, {
        kind: 'message',
        text: (await speak(token.userId))('telegram.linked'),
        buttons: [],
      });
      return finish('linked');
    }

    const found = await account.findTelegramSubject(tx, from.id);
    if (!found) return finish('not-linked');
    await lock(tx, 'telegram-user', found.userId);
    const link = await account.findTelegramLinkById(tx, found.id);
    if (!link) return finish('not-linked');
    const t = await speak(link.userId);
    if (!callback && msg.date * 1000 < Math.floor(link.createdAt / 1000) * 1000) return finish('old-message');

    if (callback) {
      const command = /^(confirm|decline):(.+)$/.exec(callback.data ?? '');
      const versionId = z.uuid().safeParse(command?.[2]);
      const delivered = await conversation.findTelegramMessage(tx, link.id, msg.message_id);
      const entry = delivered?.entryId ? await conversation.findEntry(tx, delivered.entryId) : undefined;
      if (
        !command ||
        !versionId.success ||
        entry?.kind !== 'proposal' ||
        entry.body.versionId !== versionId.data
      ) {
        await reply(deps, tx, link.id, update.update_id, {
          kind: 'callback',
          queryId: callback.id,
          text: t('telegram.staleButton'),
        });
        return finish('invalid-button');
      }
      const result = await confirmProposalInTransaction(deps, tx, link.userId, {
        versionId: versionId.data,
        decision: command[1] === 'confirm' ? 'confirmed' : 'declined',
      });
      await reply(deps, tx, link.id, update.update_id, {
        kind: 'callback',
        queryId: callback.id,
        text:
          result.kind === 'decided'
            ? t(command[1] === 'confirm' ? 'telegram.confirmed' : 'telegram.declined')
            : t('telegram.notDecided'),
      });
      return finish(result.kind === 'decided' ? 'decided' : result.reason);
    }
    const text = msg.text?.trim();
    if (text === '/stop') {
      await account.deleteTelegramLink(tx, link.userId);
      await account.revokeTelegramTokens(tx, link.userId);
      return finish('unlinked');
    }
    if (!text) return finish('unsupported-message');
    if (text.startsWith('/')) {
      await reply(deps, tx, link.id, update.update_id, {
        kind: 'message',
        text: t('telegram.help'),
        buttons: [],
      });
      return finish('help');
    }
    const personal = await broker.findBroker(tx, link.userId);
    if (!personal) return finish('not-found');
    const replied = msg.reply_to_message
      ? await conversation.findTelegramMessage(tx, link.id, msg.reply_to_message.message_id)
      : undefined;
    // An unmapped reply must not silently enter the wrong market conversation.
    if (msg.reply_to_message && !replied?.conversationId) {
      await reply(deps, tx, link.id, update.update_id, {
        kind: 'message',
        text: t('telegram.unknownReply'),
        buttons: [],
      });
      return finish('unknown-reply');
    }
    const chatId =
      replied?.conversationId ??
      (await conversation.ensureConversation(tx, link.userId, personal.id, 'broker')).id;
    const result = await sendMessageInTransaction(deps, tx, link.userId, {
      requestId: newId(),
      conversationId: chatId,
      text,
      reviseProposalVersionId: null,
    });
    return finish(result.kind === 'sent' ? 'message' : result.reason);
  });
}
