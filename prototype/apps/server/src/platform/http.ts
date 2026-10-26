/** Bound memory while reading an untrusted response, before JSON parsing. */
export async function boundedJson(response: Response, maxBytes: number): Promise<unknown> {
  return JSON.parse(await boundedText(response, maxBytes));
}

/**
 * Bound memory while streaming an untrusted response: the body passes on as it comes, and fails with `tooLarge()` once
 * it has grown past `maxBytes`.
 */
export function boundedBody(response: Response, maxBytes: number, tooLarge: () => Error): Response {
  if (!response.body) return response;
  let size = 0;
  const body = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > maxBytes) controller.error(tooLarge());
        else controller.enqueue(chunk);
      },
    }),
  );
  return new Response(body, { status: response.status, headers: response.headers });
}

export async function boundedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) throw new Error('Empty response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Response exceeds size limit');
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
}
