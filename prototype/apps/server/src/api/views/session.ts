import { type Locale, translator } from '@reinforce/i18n/server';
import { utcDay } from '../../kernel/time.js';
import type { User } from '../../modules/account/index.js';
import { findModelCredential, findTelegramLink } from '../../modules/account/index.js';
import * as broker from '../../modules/broker/index.js';
import * as conversation from '../../modules/conversation/index.js';
import * as forecast from '../../modules/forecast/index.js';
import * as runtime from '../../modules/runtime/index.js';
import { EXECUTION_RULES } from '../../modules/trading/index.js';
import type { Deps } from '../../workflows/deps.js';
import { telegramAvailable } from '../../workflows/link-telegram.js';
import { loginAvailable } from '../../workflows/login.js';
import { ownModelAvailable } from '../../workflows/own-model.js';
import type { Pulse, Session, UiPreferences } from '../view-types.js';
import { classes, marketOverview } from './market.js';
import { portfolioView } from './portfolio.js';

export const preferencesView = (prefs: ReturnType<typeof broker.defaultPreferences>): UiPreferences => ({
  classes: [],
  markets: prefs.markets,
  mode: prefs.mode,
  maxTradeUsd: Number(prefs.maxTradeUsd),
  analysisLimit: prefs.analysisLimit,
  ideaLimit: prefs.ideaLimit,
  autoAnalysis: prefs.autoAnalysis,
  alerts: prefs.alerts,
  actionableOnly: prefs.actionableOnly,
  quiet: { on: prefs.quiet.enabled, from: prefs.quiet.from, to: prefs.quiet.to, tz: prefs.quiet.timezone },
  style: prefs.style,
});
/** `locale` is the language this request is answered in; with no choice on the device the page takes it on. */
export async function sessionView(deps: Deps, user: User | undefined, locale: Locale): Promise<Session> {
  const telegram = user ? await findTelegramLink(deps.db, user.id) : undefined;
  const personal = user ? await broker.findBroker(deps.db, user.id) : undefined;
  const head = personal ? await broker.loadHead(deps.db, personal.id) : null;
  const version = head ? await broker.findVersion(deps.db, head.versionId) : null;
  const prefs = head?.preferences ?? broker.defaultPreferences();
  const limit = !user || user.guest ? deps.config.DAILY_GUEST_CALLS : deps.config.DAILY_USER_CALLS;
  const quota = user
    ? await runtime.quotaUsage(deps.db, `user:${user.id}`, utcDay(deps.clock.now()))
    : { reserved: 0, spent: 0 };
  const ownAvailable = ownModelAvailable(deps);
  const own = user && ownAvailable ? await findModelCredential(deps.db, user.id) : undefined;
  const overview = await marketOverview(deps, locale, prefs.markets);
  const portfolio = await portfolioView(deps, user?.id, locale);
  return {
    environment: deps.config.MARKET_MODE,
    locale,
    auth: { xaiAvailable: loginAvailable(deps), ownModelAvailable: ownAvailable },
    user: { name: user?.name ?? '', guest: user?.guest ?? true },
    model: own?.active === true || quota.reserved + quota.spent < limit,
    ai: {
      own: Boolean(own),
      route: own?.active ? 'own' : 'free',
      free: {
        left: Math.max(0, limit - quota.reserved - quota.spent),
        limit,
        resetAt: (utcDay(deps.clock.now()) + 1) * 86400000,
      },
    },
    agent: { id: personal?.id ?? '' },
    balance: { nav: portfolio.user.nav, returnPct: portfolio.user.returnPct },
    connection: {
      provider: deps.config.MODEL_MODE === 'replay' ? 'scripted' : 'xai',
      model: deps.config.MODEL_MODE === 'replay' ? 'replay-fixture-v1' : deps.config.OPENROUTER_MODEL,
    },
    version: version
      ? {
          id: version.id,
          n: version.number,
          model: deps.config.MODEL_MODE === 'replay' ? 'scripted' : 'grok',
          harness: translator(locale)('harness.builtin'),
          harnessKind: 'builtin',
        }
      : null,
    preferences: preferencesView(prefs),
    telegram: {
      linked: Boolean(telegram),
      username: telegram?.username ?? null,
      bot: deps.config.TELEGRAM_BOT_USERNAME ?? null,
      available: telegramAvailable(deps),
    },
    market: overview.state,
    classes: classes(locale),
    rules: {
      detector: { profile: 'upstream', version: 'atp-signal', robustZ: null },
      tauPct: forecast.SCORING_RULES.neutralPct,
      execution: {
        version: EXECUTION_RULES.version,
        feeRate: Number(EXECUTION_RULES.feeRate),
        slippageBps: EXECUTION_RULES.slippageBps,
        funding: 'DISABLED',
        startNav: 10000,
      },
      t0OffsetSeconds: 60,
      customRuntime: null,
    },
  };
}
export async function pulseView(deps: Deps, user: User | undefined, locale: Locale): Promise<Pulse> {
  const telegram = user ? await findTelegramLink(deps.db, user.id) : undefined;
  const chats = user ? await conversation.listConversations(deps.db, user.id) : [];
  const { phase, lastBarEnd, message, loaded, total } = (await marketOverview(deps, locale)).state;
  return {
    accountId: user?.id ?? null,
    now: deps.clock.now(),
    telegramLinkId: telegram?.id ?? null,
    conversations: Object.fromEntries(chats.map((chat) => [chat.topic, chat.nextSeq])),
    market: { phase, lastBarEnd, message, loaded, total },
  };
}
