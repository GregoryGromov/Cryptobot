import { vi } from 'vitest';

export type TrpcCall = { readonly path: string; readonly input: unknown };

type Responder = (path: string, input: unknown) => unknown;

const batchInputs = (query: string, body: BodyInit | null | undefined): Record<string, unknown> => {
  const raw = typeof body === 'string' ? body : (new URLSearchParams(query).get('input') ?? '{}');
  const parsed: unknown = JSON.parse(raw);
  return typeof parsed === 'object' && parsed !== null ? Object.fromEntries(Object.entries(parsed)) : {};
};

export const stubTrpc = (respond: Responder): readonly TrpcCall[] => {
  const calls: TrpcCall[] = [];
  vi.stubGlobal('fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    const [, route = ''] = String(url).split('/trpc/');
    const [paths = '', query = ''] = route.split('?');
    const inputs = batchInputs(query, init?.body);
    const results = decodeURIComponent(paths)
      .split(',')
      .map((path, index) => {
        const input = inputs[String(index)];
        calls.push({ path, input });
        return { result: { data: respond(path, input) } };
      });
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  return calls;
};
