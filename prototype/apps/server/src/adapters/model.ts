import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  APICallError,
  generateText,
  InvalidResponseDataError,
  JSONParseError,
  jsonSchema,
  NoObjectGeneratedError,
  Output,
  streamText,
} from 'ai';
import { z } from 'zod';
import { boundedBody, boundedText } from '../platform/http.js';

export type ModelRequest = {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  maxTokens: number;
  schema: Record<string, unknown>;
  /** How long a reasoning model may think before it answers; the model's own default when absent. */
  reasoning?: 'low' | 'medium' | 'high' | undefined;
};
export type ModelResult = {
  content: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cost: number | null;
};
export const modelRequestSchema = z.object({
  model: z.string(),
  maxTokens: z.number().int().positive(),
  messages: z
    .array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().max(64000) }))
    .max(40),
  schema: z.record(z.string(), z.unknown()),
  reasoning: z.enum(['low', 'medium', 'high']).optional(),
});
export const modelResultSchema = z.object({
  content: z.string(),
  model: z.string(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  cost: z.number().nullable(),
});
/**
 * A call of the model. With `onPartial` the answer is streamed: each time it has grown, the object parsed from it so far
 * is handed over. It is not validated and may be cut anywhere; only the result counts. `attempt` is the run's attempt:
 * from the second on, a port with fallback models starts from the next one.
 */
export type ModelPort = (
  request: ModelRequest,
  signal: AbortSignal,
  onPartial?: (partial: unknown) => void,
  attempt?: number,
) => Promise<ModelResult>;
export class ModelFailure extends Error {
  readonly kind: 'refused' | 'rate-limited' | 'unavailable' | 'invalid-response';
  constructor(kind: ModelFailure['kind']) {
    super(`Model ${kind}`);
    this.kind = kind;
  }
}
/** The SDK owns provider transport; our runtime owns retries, budgets and durable call facts. */
/**
 * `fallbacks`: models OpenRouter tries in order when the requested one fails, rate limits included; a run tried again
 * starts from the next of them. The answer carries the model that actually replied, and the run records it. A streamed
 * call that hears nothing, neither reasoning nor answer, for `silenceMs` is given up as unavailable.
 */
export function openRouter(
  apiKey: string,
  fetcher: typeof fetch = fetch,
  fallbacks: readonly string[] = [],
  silenceMs = 60_000,
): ModelPort {
  const MAX_BYTES = 256000;
  // A streamed answer comes a token per event, each in an envelope of its own: some hundred times its text.
  const STREAMED_MAX_BYTES = 8_000_000;
  const transport = async (url: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1]) => {
    try {
      return await fetcher(url, { ...init, redirect: 'error' });
    } catch {
      throw new ModelFailure('unavailable');
    }
  };
  // A whole answer is read before the SDK parses it; a streamed one passes on as it comes, within the same bound.
  const whole = createOpenRouter({
    apiKey,
    fetch: async (url, init) => {
      const response = await transport(url, init);
      let body: string;
      try {
        body = await boundedText(response, MAX_BYTES);
      } catch {
        throw new ModelFailure('invalid-response');
      }
      return new Response(body, { status: response.status, headers: response.headers });
    },
  });
  const streamed = createOpenRouter({
    apiKey,
    fetch: async (url, init) =>
      boundedBody(await transport(url, init), STREAMED_MAX_BYTES, () => new ModelFailure('invalid-response')),
  });
  const settings = (provider: typeof whole, request: ModelRequest, signal: AbortSignal, attempt: number) => {
    // A run tried again starts from the next model: one stuck or refusing model does not hold every attempt.
    const chain = [request.model, ...fallbacks.filter((m) => m !== request.model)];
    const [model = request.model, ...rest] = chain.slice(
      Math.min(Math.max(attempt - 1, 0), chain.length - 1),
    );
    return {
      model: provider.chat(model, {
        extraBody: { provider: { require_parameters: true, allow_fallbacks: false } },
        ...(rest.length ? { models: rest } : {}),
        usage: { include: true },
        ...(request.reasoning ? { reasoning: { effort: request.reasoning } } : {}),
      }),
      messages: request.messages,
      allowSystemInMessages: true,
      maxOutputTokens: request.maxTokens,
      output: Output.object({ name: 'reinforce', schema: jsonSchema(request.schema) }),
      abortSignal: signal,
      maxRetries: 0,
    };
  };
  return async (request, signal, onPartial, attempt = 1) => {
    try {
      signal.throwIfAborted();
      let result: {
        text: string;
        finishReason: string;
        modelId: string;
        inputTokens: number | undefined;
        outputTokens: number | undefined;
        providerMetadata: Record<string, Record<string, unknown>> | undefined;
      };
      if (onPartial) {
        let failure: unknown = null;
        // The model's reasoning streams ahead of its answer: only a call that sends neither is stuck.
        const quiet = new AbortController();
        let silence = setTimeout(() => quiet.abort(), silenceMs);
        const heard = () => {
          clearTimeout(silence);
          silence = setTimeout(() => quiet.abort(), silenceMs);
        };
        try {
          const stream = streamText({
            ...settings(streamed, request, AbortSignal.any([signal, quiet.signal]), attempt),
            streamRetries: 0,
            onChunk: heard,
            onError: ({ error }) => {
              failure ??= error;
            },
          });
          for await (const partial of stream.partialOutputStream) onPartial(partial);
          if (quiet.signal.aborted) throw new ModelFailure('unavailable');
          if (failure) throw failure;
          // Access output to require valid JSON; the harness contract performs domain validation.
          await stream.output;
          const [text, finishReason, usage, providerMetadata, response] = await Promise.all([
            stream.text,
            stream.finishReason,
            stream.usage,
            stream.providerMetadata,
            stream.response,
          ]);
          result = {
            text,
            finishReason,
            modelId: response.modelId,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            providerMetadata,
          };
        } catch (error) {
          throw quiet.signal.aborted && !signal.aborted ? new ModelFailure('unavailable') : error;
        } finally {
          clearTimeout(silence);
        }
      } else {
        const done = await generateText(settings(whole, request, signal, attempt));
        // Access output to require valid JSON; the harness contract performs domain validation.
        void done.output;
        result = {
          text: done.text,
          finishReason: done.finishReason,
          modelId: done.response.modelId,
          inputTokens: done.usage.inputTokens,
          outputTokens: done.usage.outputTokens,
          providerMetadata: done.providerMetadata,
        };
      }
      if (!result.text || result.finishReason === 'length' || result.finishReason === 'content-filter')
        throw new ModelFailure('invalid-response');
      const usage = z
        .object({ cost: z.number().nonnegative().optional() })
        .safeParse(result.providerMetadata?.openrouter?.usage);
      return {
        content: result.text,
        model: result.modelId,
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
        cost: usage.success ? (usage.data.cost ?? null) : null,
      };
    } catch (error) {
      const own = ownFailure(error);
      if (own) throw own;
      if (APICallError.isInstance(error))
        throw new ModelFailure(
          error.statusCode === 429
            ? 'rate-limited'
            : error.statusCode === undefined || error.statusCode >= 500
              ? 'unavailable'
              : 'refused',
        );
      if (
        NoObjectGeneratedError.isInstance(error) ||
        InvalidResponseDataError.isInstance(error) ||
        JSONParseError.isInstance(error)
      )
        throw new ModelFailure('invalid-response');
      throw new ModelFailure('unavailable');
    }
  };
}

/** A failure of ours raised inside the SDK's transport comes back wrapped by it, as the cause of its own error. */
const ownFailure = (error: unknown, depth = 0): ModelFailure | null =>
  error instanceof ModelFailure
    ? error
    : depth < 5 && error && typeof error === 'object' && 'cause' in error
      ? ownFailure(error.cause, depth + 1)
      : null;
