import { Api } from 'grammy';
import { parseConfig } from './platform/config.js';

const config = parseConfig(process.env);
if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_WEBHOOK_SECRET || !config.TELEGRAM_BOT_USERNAME)
  throw new Error('Telegram configuration is incomplete');
const url = new URL('/api/telegram/webhook', config.PUBLIC_URL);
if (url.protocol !== 'https:') throw new Error('Telegram webhook requires a public HTTPS URL');
const api = new Api(config.TELEGRAM_BOT_TOKEN, { timeoutSeconds: 10 });
try {
  const bot = await api.getMe();
  if (bot.username?.toLowerCase() !== config.TELEGRAM_BOT_USERNAME.toLowerCase())
    throw new Error('Bot username does not match configuration');
  await api.setWebhook(url.toString(), {
    secret_token: config.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });
  process.stdout.write(`Telegram webhook configured: ${url}\n`);
} catch {
  // Provider errors can contain request payloads, including the webhook secret.
  process.stderr.write('Telegram webhook setup failed. Check HTTPS reachability and bot configuration.\n');
  process.exitCode = 1;
}
