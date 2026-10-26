import { boundedText } from '../platform/http.js';
import { ModelFailure, type ModelRequest, type ModelResult } from './model.js';

/**
 * A user's own Grok, reached with the tokens of their xAI sign-in through the service the Grok CLI talks to.
 * Experimental: xAI offers no agreed way for a third party to spend a user's subscription, and may close this one.
 */
const BASE = 'https://cli-chat-proxy.grok.com/v1';
/** The release of the official CLI this was checked against; the service refuses clients it considers too old. */
const CLI_VERSION = '1.0.46';
const MAX_BYTES = 1_000_000;
const CATALOG_TTL_MS = 10 * 60_000;

export type OwnModelAuth = { accessToken: string; subject: string };
export type OwnModelPort = (
  request: ModelRequest,
  auth: OwnModelAuth,
  signal: AbortSignal,
) => Promise<ModelResult>;

type CatalogModel = {
  id: string;
  model: string;
  route: string;
  backend: 'chat_completions' | 'responses';
  effort: string | null;
};

const identifier = (value: unknown): string | null =>
  typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,199}$/.test(value) ? value : null;
const field = (value: Record<string, unknown>, camel: string, snake = camel): unknown => {
  const meta = (value._meta ?? {}) as Record<string, unknown>;
  return value[camel] ?? value[snake] ?? meta[camel] ?? meta[snake];
};

/** The models an account may choose, in the order xAI lists them. Only names are kept: no address, no extra header. */
export function catalogModels(body: unknown): CatalogModel[] | null {
  const data = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) return null;
  return data.slice(0, 200).flatMap((raw): CatalogModel[] => {
    if (typeof raw !== 'object' || raw === null) return [];
    const value = raw as Record<string, unknown>;
    const model = identifier(field(value, 'model') ?? field(value, 'modelId') ?? value.id);
    if (!model) return [];
    const backend = field(value, 'apiBackend', 'api_backend') ?? 'chat_completions';
    if (backend !== 'chat_completions' && backend !== 'responses') return [];
    const base = field(value, 'baseUrl', 'base_url');
    if (base !== undefined && base !== BASE && base !== `${BASE}/`) return [];
    if (
      field(value, 'hidden') === true ||
      field(value, 'userSelectable', 'user_selectable') === false ||
      field(value, 'available') === false
    )
      return [];
    const extra = field(value, 'extraHeaders', 'extra_headers');
    const override =
      typeof extra === 'object' && extra !== null
        ? Object.entries(extra).find(([key]) => key.toLowerCase() === 'x-grok-model-override')?.[1]
        : undefined;
    const route = identifier(override ?? model);
    if (!route) return [];
    const capabilities = (value.capabilities ?? {}) as Record<string, unknown>;
    const efforts = field(value, 'reasoningEfforts', 'reasoning_efforts') ?? capabilities.reasoning_effort;
    const supported = Array.isArray(efforts)
      ? efforts.map((option) =>
          typeof option === 'string' ? option : (option as { value?: unknown } | null)?.value,
        )
      : [];
    const effort = ['minimal', 'low', 'medium', 'high'].find((option) => supported.includes(option)) ?? null;
    return [{ id: identifier(value.id) ?? model, model, route, backend, effort }];
  });
}

/** The account's default model when it is in the catalog, else the first the catalog offers. */
export function chooseModel(models: readonly CatalogModel[], settings: unknown): CatalogModel | null {
  const raw = (settings ?? {}) as Record<string, unknown>;
  const preferred = identifier(raw.default_model ?? raw.defaultModel);
  return (preferred && models.find((m) => [m.id, m.model, m.route].includes(preferred))) || models[0] || null;
}

type Packet = Record<string, unknown>;
const outputText = (response: unknown): string => {
  const output = (response as { output?: unknown } | null)?.output;
  if (!Array.isArray(output)) return '';
  return output
    .flatMap((item: { type?: unknown; content?: unknown }) =>
      item?.type === 'message' && Array.isArray(item.content)
        ? item.content.flatMap((part: { type?: unknown; text?: unknown }) =>
            part?.type === 'output_text' && typeof part.text === 'string' ? [part.text] : [],
          )
        : [],
    )
    .join('');
};
const tokens = (usage: unknown, ...names: string[]): number | null => {
  for (const name of names) {
    const value = (usage as Record<string, unknown> | undefined)?.[name];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
};

/** An answer that came as a stream of events or as one body: its text, the model that wrote it and what it cost in tokens. */
export function readAnswer(raw: string): { text: string; model: string | null; usage: unknown } {
  const streamed = /^\s*(data|event):/.test(raw);
  if (!streamed) {
    let body: Packet;
    try {
      body = JSON.parse(raw) as Packet;
    } catch {
      throw new ModelFailure('invalid-response');
    }
    if (body.error) throw new ModelFailure('refused');
    const choice = (body.choices as { message?: { content?: unknown } }[] | undefined)?.[0];
    const text = typeof choice?.message?.content === 'string' ? choice.message.content : outputText(body);
    return { text, model: typeof body.model === 'string' ? body.model : null, usage: body.usage };
  }
  let text = '';
  let model: string | null = null;
  let usage: unknown;
  let complete = false;
  for (const event of raw.replace(/\r\n/g, '\n').split('\n\n')) {
    const data = event
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data) continue;
    if (data.trim() === '[DONE]') {
      complete = true;
      continue;
    }
    let packet: Packet;
    try {
      packet = JSON.parse(data) as Packet;
    } catch {
      throw new ModelFailure('invalid-response');
    }
    if (packet.error || packet.type === 'error') throw new ModelFailure('refused');
    if (packet.type === 'response.failed' || packet.type === 'response.incomplete')
      throw new ModelFailure('invalid-response');
    if (packet.type === 'response.output_text.delta' && typeof packet.delta === 'string')
      text += packet.delta;
    if (packet.type === 'response.completed') {
      const response = packet.response as Packet | undefined;
      if (response?.error) throw new ModelFailure('refused');
      complete = true;
      if (typeof response?.model === 'string') model = response.model;
      usage = response?.usage ?? usage;
      if (!text) text = outputText(response);
    }
    if (typeof packet.model === 'string') model = packet.model;
    if (packet.usage) usage = packet.usage;
    const choice = (
      packet.choices as { delta?: { content?: unknown }; finish_reason?: unknown }[] | undefined
    )?.[0];
    if (typeof choice?.delta?.content === 'string') text += choice.delta.content;
    if (choice?.finish_reason) complete = true;
  }
  if (!complete) throw new ModelFailure('invalid-response');
  return { text, model, usage };
}

/** The one JSON object in an answer: a model asked for JSON may still wrap it in a fence or a sentence. */
export function jsonObject(text: string): string {
  const from = text.indexOf('{');
  const to = text.lastIndexOf('}');
  if (from === -1 || to <= from) throw new ModelFailure('invalid-response');
  try {
    return JSON.stringify(JSON.parse(text.slice(from, to + 1)));
  } catch {
    throw new ModelFailure('invalid-response');
  }
}

const failureOf = (status: number): ModelFailure =>
  new ModelFailure(
    status === 402 || status === 429 ? 'rate-limited' : status >= 500 ? 'unavailable' : 'refused',
  );

export function grokCli(options: { fetcher?: typeof fetch; cliVersion?: string } = {}): OwnModelPort {
  const fetcher = options.fetcher ?? fetch;
  const catalogs = new Map<string, { at: number; model: CatalogModel }>();
  const headers = (auth: OwnModelAuth) => ({
    accept: 'application/json',
    authorization: `Bearer ${auth.accessToken}`,
    'user-agent': 'reinforce/1.0',
    'x-xai-token-auth': 'xai-grok-cli',
    'x-authenticateresponse': 'authenticate-response',
    'x-grok-client-version': options.cliVersion ?? CLI_VERSION,
    'x-grok-client-identifier': 'reinforce',
    'x-grok-client-mode': 'interactive',
    'x-userid': auth.subject,
  });
  async function send(url: string, init: RequestInit, signal: AbortSignal) {
    let response: Response;
    try {
      response = await fetcher(url, { ...init, redirect: 'error', signal });
    } catch {
      throw new ModelFailure('unavailable');
    }
    let body: string;
    try {
      body = await boundedText(response, MAX_BYTES);
    } catch {
      throw new ModelFailure('invalid-response');
    }
    return { status: response.status, ok: response.ok, body };
  }
  async function selected(auth: OwnModelAuth, signal: AbortSignal): Promise<CatalogModel> {
    const cached = catalogs.get(auth.subject);
    if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return cached.model;
    const [catalog, settings] = await Promise.all([
      send(`${BASE}/models`, { headers: headers(auth) }, signal),
      send(`${BASE}/settings`, { headers: headers(auth) }, signal).catch(() => null),
    ]);
    if (!catalog.ok) throw failureOf(catalog.status);
    let models: CatalogModel[] | null;
    let preferences: unknown = null;
    try {
      models = catalogModels(JSON.parse(catalog.body));
      if (settings?.ok) preferences = JSON.parse(settings.body);
    } catch {
      throw new ModelFailure('invalid-response');
    }
    const model = models && chooseModel(models, preferences);
    if (!model) throw new ModelFailure('refused');
    catalogs.set(auth.subject, { at: Date.now(), model });
    return model;
  }
  return async (request, auth, signal) => {
    signal.throwIfAborted();
    const model = await selected(auth, signal);
    const messages = [
      ...request.messages,
      {
        role: 'system' as const,
        content: `Answer with one JSON object and nothing else. It must match this JSON Schema:\n${JSON.stringify(request.schema)}`,
      },
    ];
    const effort = model.effort && request.reasoning ? { effort: request.reasoning } : null;
    const body =
      model.backend === 'responses'
        ? {
            model: model.model,
            input: messages,
            max_output_tokens: request.maxTokens,
            stream: true,
            store: false,
            ...(effort ? { reasoning: effort } : {}),
          }
        : {
            model: model.model,
            messages,
            max_tokens: request.maxTokens,
            stream: true,
            ...(effort ? { reasoning_effort: effort.effort } : {}),
          };
    const result = await send(
      model.backend === 'responses' ? `${BASE}/responses` : `${BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          ...headers(auth),
          'content-type': 'application/json',
          'x-grok-model-override': model.route,
        },
        body: JSON.stringify(body),
      },
      signal,
    );
    if (!result.ok) {
      // A catalog read before the account's access changed must not outlive the refusal.
      catalogs.delete(auth.subject);
      throw failureOf(result.status);
    }
    const answer = readAnswer(result.body);
    return {
      content: jsonObject(answer.text),
      model: (answer.model ?? model.model).slice(0, 150),
      inputTokens: tokens(answer.usage, 'prompt_tokens', 'input_tokens'),
      outputTokens: tokens(answer.usage, 'completion_tokens', 'output_tokens'),
      cost: null,
    };
  };
}
