import { timingSafeEqual } from 'node:crypto';
import { Api, GrammyError } from 'grammy';
import { z } from 'zod';
import { sha256 } from '../platform/identity.js';

const telegramId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const sender = z.object({
  id: telegramId,
  is_bot: z.boolean(),
  username: z.string().max(64).optional(),
  /** The language of the person's Telegram: replies before the account is known are written in it. */
  language_code: z.string().max(35).optional(),
});
const message = z.object({
  message_id: telegramId,
  date: z.number().int().nonnegative(),
  chat: z.object({ id: z.number().int().safe(), type: z.string() }),
  from: sender.optional(),
  text: z.string().max(8000).optional(),
  reply_to_message: z.object({ message_id: telegramId }).optional(),
});
export const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative().safe(),
  message: message.optional(),
  callback_query: z
    .object({
      id: z.string().min(1).max(200),
      from: sender,
      message: message.optional(),
      data: z.string().max(64).optional(),
    })
    .optional(),
});

export const telegramPayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('message'),
    text: z.string().min(1).max(4096),
    buttons: z.array(z.object({ text: z.string(), data: z.string().max(64) })).default([]),
  }),
  z.object({ kind: z.literal('callback'), queryId: z.string(), text: z.string().max(200) }),
]);
export type TelegramPayload = z.infer<typeof telegramPayloadSchema>;
export type TelegramResult =
  | { kind: 'sent'; messageId: number | null }
  | { kind: 'retry'; afterSeconds: number }
  | { kind: 'failed' | 'unknown' };
export type TelegramPort = { send(subject: number, payload: TelegramPayload): Promise<TelegramResult> };

export function telegramSecretMatches(expected: string, actual: string | undefined): boolean {
  return actual !== undefined && timingSafeEqual(Buffer.from(sha256(expected)), Buffer.from(sha256(actual)));
}

export function telegramApi(token: string): TelegramPort {
  const api = new Api(token, { timeoutSeconds: 10 });
  return {
    async send(subject, payload) {
      try {
        if (payload.kind === 'callback') {
          await api.answerCallbackQuery(payload.queryId, { text: payload.text });
          return { kind: 'sent', messageId: null };
        }
        const sent = await api.sendMessage(subject, payload.text, {
          link_preview_options: { is_disabled: true },
          ...(payload.buttons.length
            ? {
                reply_markup: {
                  inline_keyboard: [
                    payload.buttons.map((b) => ({
                      text: b.text,
                      callback_data: b.data,
                    })),
                  ],
                },
              }
            : {}),
        });
        return { kind: 'sent', messageId: telegramId.parse(sent.message_id) };
      } catch (error) {
        if (error instanceof GrammyError) {
          if (error.error_code === 429)
            return {
              kind: 'retry',
              afterSeconds: Math.max(1, Math.min(86400, error.parameters.retry_after ?? 30)),
            };
          if (error.error_code >= 400 && error.error_code < 500) return { kind: 'failed' };
        }
        // A timeout or lost response may follow a successful send. Do not send it again blindly.
        return { kind: 'unknown' };
      }
    },
  };
}
