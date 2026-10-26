import type { Preferences } from '@reinforce/harness-contract';
import { FALLBACK_LOCALE, signedUsd, translator } from '@reinforce/i18n/server';
import { type TelegramPayload, type TelegramPort, telegramPayloadSchema } from '../adapters/telegram.js';
import * as account from '../modules/account/index.js';
import * as broker from '../modules/broker/index.js';
import * as conversation from '../modules/conversation/index.js';
import * as trading from '../modules/trading/index.js';
import { inTransaction, lock, type Tx } from '../platform/db.js';
import { newId } from '../platform/identity.js';
import { enqueue } from '../platform/jobs.js';
import type { Deps } from './deps.js';

const journalKinds = new Set(['broker-message', 'proposal', 'trade-closed', 'run-error']);

/** Explicit time input; Intl handles local hours and DST, including a repeated hour. */
export function telegramQuietUntil(now: number, quiet: Preferences['quiet']): number | null {
  if (!quiet.enabled || quiet.from === quiet.to) return null;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: quiet.timezone,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const isQuiet = (at: number) => {
    const hour = Number(formatter.format(at));
    return quiet.from < quiet.to
      ? hour >= quiet.from && hour < quiet.to
      : hour >= quiet.from || hour < quiet.to;
  };
  if (!isQuiet(now)) return null;
  let at = Math.floor(now / 60_000) * 60_000 + 60_000;
  while (isQuiet(at) && at < now + 48 * 3600_000) at += 60_000;
  return at;
}

export async function queueTelegramJournal(deps: Deps) {
  for (const original of await account.listTelegramLinks(deps.db)) {
    await inTransaction(deps.db, async (tx) => {
      await lock(tx, 'telegram-user', original.userId);
      const link = await account.findTelegramLinkById(tx, original.id);
      if (!link) return;
      for (const chat of await conversation.listConversations(tx, link.userId)) {
        const seq = await conversation.telegramCursor(tx, link.id, chat.id);
        const entries = await conversation.readEntries(tx, chat.id, seq, 100);
        for (const entry of entries) {
          if (!journalKinds.has(entry.kind) || entry.createdAt < link.createdAt) continue;
          const id = newId();
          await conversation.recordTelegramDelivery(tx, {
            id,
            linkId: link.id,
            sourceId: `entry:${entry.id}`,
            conversationId: chat.id,
            entryId: entry.id,
            status: 'pending',
            createdAt: deps.clock.now(),
          });
          await enqueue(deps.jobs, tx, 'notification.send', id);
        }
        if (entries.length) await conversation.setTelegramCursor(tx, link.id, chat.id, entries.at(-1)!.seq);
      }
    });
  }
}

async function journalPayload(
  deps: Deps,
  tx: Tx,
  link: account.TelegramLink,
  delivery: conversation.TelegramDelivery,
): Promise<{ kind: 'send'; payload: TelegramPayload } | { kind: 'skip' } | { kind: 'defer'; at: number }> {
  if (!delivery.entryId || !delivery.conversationId) return { kind: 'skip' };
  const chat = await conversation.findConversation(tx, delivery.conversationId, link.userId);
  const entry = await conversation.findEntry(tx, delivery.entryId);
  if (!chat || !entry) return { kind: 'skip' };
  const prefs = (await broker.loadHead(tx, chat.brokerId)).preferences;
  const locale = (await account.findUser(tx, link.userId))?.locale ?? FALLBACK_LOCALE;
  const t = translator(locale);
  const url = new URL(conversation.topicHref(chat.topic), deps.config.PUBLIC_URL).toString();
  let text: string;
  let buttons: { text: string; data: string }[] = [];
  if (entry.kind === 'proposal') {
    const version =
      typeof entry.body.versionId === 'string'
        ? await trading.findProposalVersion(tx, entry.body.versionId)
        : undefined;
    if (
      !version ||
      version.validUntil <= deps.clock.now() ||
      (await trading.latestProposalVersion(tx, version.proposalId))?.id !== version.id ||
      (await trading.findDecision(tx, version.proposalId))
    )
      return { kind: 'skip' };
    const source = await conversation.findEntry(tx, version.sourceId);
    if (!prefs.alerts && source?.kind !== 'user-message') return { kind: 'skip' };
    const terms = version.terms;
    const rules = trading.rulesFor('lower');
    text = t('telegram.proposal', {
      instrument: terms.instrument,
      side: t(terms.side === 'LONG' ? 'telegram.long' : 'telegram.short'),
      amount: `$${terms.amount}`,
      stop: terms.stopPct,
      target: terms.targetPct,
      horizon: terms.horizon,
      slippage: rules.slippageBps,
      fee: Number(rules.feeRate) * 100,
      until: new Date(version.validUntil).toISOString(),
    });
    buttons = [
      { text: t('telegram.confirm'), data: `confirm:${version.id}` },
      { text: t('telegram.decline'), data: `decline:${version.id}` },
    ];
  } else if (entry.kind === 'broker-message') {
    const source =
      typeof entry.body.replyTo === 'string'
        ? await conversation.findEntry(tx, entry.body.replyTo)
        : undefined;
    if (source?.kind !== 'user-message' && (!prefs.alerts || prefs.actionableOnly)) return { kind: 'skip' };
    if (typeof entry.body.text !== 'string' || !entry.body.text.trim()) return { kind: 'skip' };
    text = plainWords(entry.body.text);
  } else if (entry.kind === 'trade-closed') {
    if (entry.body.account !== 'user') return { kind: 'skip' };
    const pnl = Number(entry.body.pnl);
    text = t('telegram.tradeClosed', {
      instrument: chat.topic,
      pnl: Number.isFinite(pnl) ? signedUsd(pnl, locale) : String(entry.body.pnl),
    });
  } else if (entry.kind === 'run-error') {
    const source =
      typeof entry.body.sourceId === 'string'
        ? await conversation.findEntry(tx, entry.body.sourceId)
        : undefined;
    if (source?.kind !== 'user-message' && !prefs.alerts) return { kind: 'skip' };
    text = t('telegram.runError');
  } else return { kind: 'skip' };
  const quietUntil = telegramQuietUntil(deps.clock.now(), prefs.quiet);
  if (quietUntil !== null) return { kind: 'defer', at: quietUntil };
  const label = conversation.isGeneral(chat.topic) ? t('telegram.broker') : chat.topic;
  const suffix = `\n\n${url}`;
  const content = `${label}\n${text}`;
  const max = 4000 - suffix.length;
  return {
    kind: 'send',
    payload: {
      kind: 'message',
      text: (content.length > max ? `${content.slice(0, max - 1)}…` : content) + suffix,
      buttons,
    },
  };
}

// Telegram gets plain text: the marks the web draws (strong words, $TICKER chips, dashed points) are said in words.
const plainWords = (text: string): string =>
  text
    .replace(/\*\*/g, '')
    .replace(/\$(?:[a-z]{1,8}:)?([A-Za-z][A-Za-z0-9]{0,11})(?![A-Za-z0-9])/g, (_, ticker: string) =>
      ticker.toUpperCase(),
    )
    .replace(/^\s*[-•*–]\s+/gm, '• ');

export async function sendTelegram(deps: Deps, port: TelegramPort, id: string) {
  const initial = await conversation.findTelegramDelivery(deps.db, id);
  if (!initial) return;
  const linked = await account.findTelegramLinkById(deps.db, initial.linkId);
  const claimed = await inTransaction(deps.db, async (tx) => {
    if (linked) await lock(tx, 'telegram-user', linked.userId);
    await lock(tx, 'telegram-delivery', id);
    const delivery = await conversation.findTelegramDelivery(tx, id);
    if (!delivery || !['pending', 'sending'].includes(delivery.status)) return null;
    if (delivery.status === 'sending') {
      if ((delivery.leaseUntil ?? 0) > deps.clock.now()) {
        await enqueue(deps.jobs, tx, 'notification.send', id, delivery.leaseUntil!);
      } else await conversation.updateTelegramDelivery(tx, id, { status: 'unknown' });
      return null;
    }
    if (delivery.notBefore > deps.clock.now()) return null;
    if (delivery.attempts >= 5) {
      await conversation.updateTelegramDelivery(tx, id, { status: 'failed' });
      return null;
    }
    const link = await account.findTelegramLinkById(tx, delivery.linkId);
    if (!link) {
      await conversation.updateTelegramDelivery(tx, id, { status: 'skipped' });
      return null;
    }
    const planned = delivery.entryId
      ? await journalPayload(deps, tx, link, delivery)
      : { kind: 'send' as const, payload: telegramPayloadSchema.parse(delivery.payload) };
    if (planned.kind === 'skip') {
      await conversation.updateTelegramDelivery(tx, id, { status: 'skipped' });
      return null;
    }
    if (planned.kind === 'defer') {
      await conversation.updateTelegramDelivery(tx, id, { notBefore: planned.at });
      await enqueue(deps.jobs, tx, 'notification.send', id, planned.at);
      return null;
    }
    const attemptId = newId();
    await conversation.updateTelegramDelivery(tx, id, {
      status: 'sending',
      attempts: delivery.attempts + 1,
      attemptId,
      leaseUntil: deps.clock.now() + 60_000,
      payload: planned.payload,
    });
    return { subject: link.subject, payload: planned.payload, attemptId };
  });
  if (!claimed) return;
  // All network access is outside the transaction. The adapter must classify ambiguity.
  const result = await port
    .send(claimed.subject, claimed.payload)
    .catch(() => ({ kind: 'unknown' as const }));
  await inTransaction(deps.db, async (tx) => {
    await lock(tx, 'telegram-delivery', id);
    const delivery = await conversation.findTelegramDelivery(tx, id);
    if (delivery?.status !== 'sending' || delivery.attemptId !== claimed.attemptId) return;
    if (result.kind === 'retry') {
      await conversation.updateTelegramDelivery(tx, id, {
        status: 'pending',
        leaseUntil: null,
        notBefore: deps.clock.now() + result.afterSeconds * 1000,
      });
      await enqueue(deps.jobs, tx, 'notification.send', id, deps.clock.now() + result.afterSeconds * 1000);
    } else
      await conversation.updateTelegramDelivery(tx, id, {
        status: result.kind,
        messageId: result.kind === 'sent' ? result.messageId : null,
        leaseUntil: null,
      });
  });
}
