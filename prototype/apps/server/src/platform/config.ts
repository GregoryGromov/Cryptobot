import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DEPLOYMENT_ENV: z.enum(['preview', 'production']).default('production'),
    ROLE: z.enum(['api', 'worker', 'migrate', 'all']).default('all'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    WEB_ROOT: z.string().min(1).optional(),
    PUBLIC_URL: z.url().default('http://localhost:8787'),
    DATABASE_URL: z.url(),
    MIGRATION_DATABASE_URL: z.url().optional(),
    MARKET_MODE: z.enum(['replay', 'live']).default('replay'),
    REPLAY_SOURCE: z.enum(['synthetic', 'atp-demo']).default('synthetic'),
    MODEL_MODE: z.enum(['replay', 'live']).default('replay'),
    ATP_SIGNAL_URL: z.url().optional(),
    ATP_SIGNAL_TOKEN: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    OPENROUTER_MODEL: z.string().min(1).default('x-ai/grok-4.7'),
    /** Tried in order when the platform model's provider refuses, as xAI does at capacity with 429. Empty: none. */
    OPENROUTER_FALLBACK_MODELS: z
      .string()
      .default('x-ai/grok-4.6,x-ai/grok-4.5,google/gemini-3.8-flash')
      .transform((v) =>
        v
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().min(1).max(100)).max(5)),
    PLATFORM_MODELS: z
      .string()
      .transform((v) =>
        v
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().min(1).max(100)).min(1).max(20))
      .optional(),
    DAILY_GLOBAL_CALLS: z.coerce.number().int().positive().default(2000),
    DAILY_USER_CALLS: z.coerce.number().int().positive().default(40),
    DAILY_GUEST_CALLS: z.coerce.number().int().positive().default(12),
    DAILY_AUTO_CALLS: z.coerce.number().int().positive().default(10),
    MODEL_MAX_TOKENS: z.coerce.number().int().min(100).max(16000).default(3000),
    // Grok answers a forecast in 40–60 s and a long one in up to two minutes; jobs expire after 240 s.
    MODEL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(180000).default(150000),
    // A streamed call hearing nothing from the model, neither reasoning nor answer, this long is stuck: tried again.
    MODEL_SILENCE_MS: z.coerce.number().int().min(1000).max(180000).default(60000),
    // Offline only: the replay model types a conversation's answer a word every this many ms; 0 answers at once.
    REPLAY_TYPING_MS: z.coerce.number().int().min(0).max(500).default(0),
    // Offline only: the replay model reads the market this long before a forecast's first word, as a live model does.
    REPLAY_THINK_MS: z.coerce.number().int().min(0).max(30000).default(0),
    SECRET_ENCRYPTION_KEY: z.string().optional(),
    XAI_CLIENT_ID: z.string().min(1).max(200).optional(),
    XAI_CLIENT_SECRET: z.string().min(1).max(4096).optional(),
    // Experimental: keep a signed-in user's xAI tokens and let their own Grok answer instead of the platform's.
    XAI_OWN_MODEL: z.enum(['off', 'on']).default('off'),
    // Experimental: the assistant reads the data a question needs before it answers, in up to AGENT_MAX_STEPS calls.
    // Off: one call with the input gathered in advance. Live models only.
    ASSISTANT_AGENT: z.enum(['off', 'on']).default('off'),
    AGENT_MAX_STEPS: z.coerce.number().int().min(2).max(6).default(4),
    // Brokers read signals by themselves, without being asked. Off: a broker answers only when a person asks.
    AUTO_ANALYSIS: z.enum(['off', 'on']).default('off'),
    AUTH_MAX_PENDING: z.coerce.number().int().min(1).max(10000).default(100),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_BOT_USERNAME: z
      .string()
      .regex(/^[A-Za-z0-9_]{5,32}$/)
      .optional(),
    TELEGRAM_WEBHOOK_SECRET: z
      .string()
      .regex(/^[A-Za-z0-9_-]{32,256}$/)
      .optional(),
    POSTHOG_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.url().default('https://eu.i.posthog.com'),
    METRICS_TOKEN: z.string().min(32).max(256).optional(),
  })
  .superRefine((env, ctx) => {
    const require = (ok: unknown, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (env.NODE_ENV === 'production' && env.ROLE !== 'migrate') {
      require(new URL(env.PUBLIC_URL).protocol === 'https:', 'PUBLIC_URL', 'HTTPS required');
      if (env.DEPLOYMENT_ENV !== 'preview')
        require(env.MODEL_MODE === 'live' &&
          env.MARKET_MODE === 'live', 'MODEL_MODE', 'Production cannot use replay');
    }
    if (env.MODEL_MODE === 'live' && env.ROLE !== 'migrate')
      require(env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY', 'Required for live calls');
    if ((env.MARKET_MODE === 'live' || env.REPLAY_SOURCE === 'atp-demo') && env.ROLE !== 'migrate') {
      require(env.ATP_SIGNAL_URL, 'ATP_SIGNAL_URL', 'Required for live market');
      require(env.ATP_SIGNAL_TOKEN, 'ATP_SIGNAL_TOKEN', 'Required for live market');
    }
    if (env.REPLAY_SOURCE === 'atp-demo')
      require(env.MARKET_MODE === 'replay', 'REPLAY_SOURCE', 'Demo requires replay market mode');
    if (env.XAI_CLIENT_SECRET) require(env.XAI_CLIENT_ID, 'XAI_CLIENT_ID', 'Required with client secret');
    if (env.XAI_CLIENT_ID)
      require(env.SECRET_ENCRYPTION_KEY, 'SECRET_ENCRYPTION_KEY', 'Required for xAI login');
    if (env.XAI_OWN_MODEL === 'on') require(env.XAI_CLIENT_ID, 'XAI_CLIENT_ID', 'Required for the own model');
    if (env.TELEGRAM_BOT_TOKEN) {
      require(env.TELEGRAM_WEBHOOK_SECRET, 'TELEGRAM_WEBHOOK_SECRET', 'Required with bot token');
      require(env.TELEGRAM_BOT_USERNAME, 'TELEGRAM_BOT_USERNAME', 'Required with bot token');
    }
    if (env.PLATFORM_MODELS)
      require(env.PLATFORM_MODELS.includes(
        env.OPENROUTER_MODEL,
      ), 'PLATFORM_MODELS', 'Must include default model');
    if (env.SECRET_ENCRYPTION_KEY)
      require(Buffer.from(env.SECRET_ENCRYPTION_KEY, 'base64').length ===
        32, 'SECRET_ENCRYPTION_KEY', 'Expected 32 bytes');
  });

export type Config = z.infer<typeof envSchema>;
export function parseConfig(env: NodeJS.ProcessEnv): Config {
  const result = envSchema.safeParse(env);
  if (!result.success)
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}

export const availableModels = (config: Config): string[] =>
  config.PLATFORM_MODELS ?? [config.OPENROUTER_MODEL];

export const usesHttpMarket = (config: Config) =>
  config.MARKET_MODE === 'live' || config.REPLAY_SOURCE === 'atp-demo';
