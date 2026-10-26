import { createHash, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from 'jose';
import { z } from 'zod';
import { boundedJson } from '../platform/http.js';

export const XAI_ISSUER = 'https://auth.x.ai' as const;
const endpoints = {
  device: `${XAI_ISSUER}/oauth2/device/code`,
  token: `${XAI_ISSUER}/oauth2/token`,
  userinfo: `${XAI_ISSUER}/oauth2/userinfo`,
  jwks: `${XAI_ISSUER}/.well-known/jwks.json`,
};
export const xaiTokensSchema = z.object({
  access_token: z.string().min(1).max(16000),
  token_type: z.string().refine((value) => value.toLowerCase() === 'bearer'),
  id_token: z.string().min(1).max(32000).optional(),
  refresh_token: z.string().min(1).max(16000).optional(),
  expires_in: z.number().int().positive().optional(),
});
export type XaiTokens = z.infer<typeof xaiTokensSchema>;
export const xaiIdentitySchema = z.object({
  issuer: z.literal(XAI_ISSUER),
  subject: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
});
export type XaiIdentity = z.infer<typeof xaiIdentitySchema>;
export type XaiDevice = {
  deviceCode: string;
  userCode: string;
  url: string;
  expiresIn: number;
  intervalMs: number;
};
export type XaiPoll =
  | { kind: 'authorized'; tokens: XaiTokens }
  | { kind: 'pending' | 'slow-down' | 'denied' | 'expired' | 'unavailable' };
export type XaiAuthPort = {
  start(): Promise<XaiDevice>;
  poll(deviceCode: string): Promise<XaiPoll>;
  verify(tokens: XaiTokens, now: number): Promise<XaiIdentity>;
  /** New tokens for a kept sign-in; absent where the deployment keeps none. A refused one must be signed in again. */
  refresh?(refreshToken: string): Promise<XaiTokens>;
};
/** What a sign-in asks xAI for: who the person is, and with the own model also the right to call their Grok. */
const IDENTITY_SCOPE = 'openid profile';
const OWN_MODEL_SCOPE = 'openid profile email offline_access grok-cli:access api:access';
export class XaiAuthFailure extends Error {
  readonly kind: 'unavailable' | 'invalid-identity' | 'invalid-response' | 'refused';
  constructor(kind: XaiAuthFailure['kind']) {
    super(`xAI authentication ${kind}`);
    this.kind = kind;
  }
}
const profileSchema = z.object({ sub: z.string().min(1).max(500), name: z.string().max(500).optional() });
const deviceSchema = z.object({
  device_code: z.string().min(1).max(4096),
  user_code: z.string().min(1).max(128),
  verification_uri: z.url(),
  verification_uri_complete: z.url().optional(),
  expires_in: z.number().int().positive().max(86400),
  interval: z.number().int().positive().max(3600).optional(),
});
const discoverySchema = z.object({
  issuer: z.literal(XAI_ISSUER),
  device_authorization_endpoint: z.literal(endpoints.device),
  token_endpoint: z.literal(endpoints.token),
  userinfo_endpoint: z.literal(endpoints.userinfo),
  jwks_uri: z.literal(endpoints.jwks),
  id_token_signing_alg_values_supported: z.array(z.string()).refine((v) => v.includes('ES256')),
});
function verificationUrl(raw: string): string {
  const url = new URL(raw);
  if (![XAI_ISSUER, 'https://accounts.x.ai'].includes(url.origin) || url.username || url.password)
    throw new XaiAuthFailure('invalid-response');
  return url.toString();
}
export function xaiAuth(options: {
  clientId: string;
  clientSecret?: string;
  ownModel?: boolean;
  fetcher?: typeof fetch;
  keys?: JWTVerifyGetKey;
}): XaiAuthPort {
  const fetcher = options.fetcher ?? fetch;
  const keys = options.keys ?? createRemoteJWKSet(new URL(endpoints.jwks), { timeoutDuration: 10000 });
  let discovered: Promise<void> | undefined;
  async function request(url: string, init: RequestInit = {}) {
    try {
      const response = await fetcher(url, {
        ...init,
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: { accept: 'application/json', 'user-agent': 'reinforce/1.0', ...init.headers },
      });
      return { status: response.status, ok: response.ok, body: await boundedJson(response, 64000) };
    } catch {
      throw new XaiAuthFailure('unavailable');
    }
  }
  async function discover() {
    discovered ??= (async () => {
      const result = await request(`${XAI_ISSUER}/.well-known/openid-configuration`);
      if (!result.ok || !discoverySchema.safeParse(result.body).success)
        throw new XaiAuthFailure('invalid-response');
    })().catch((error) => {
      discovered = undefined;
      throw error;
    });
    return discovered;
  }
  const form = (value: Record<string, string>): RequestInit => ({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...value,
      ...(options.clientSecret ? { client_secret: options.clientSecret } : {}),
    }).toString(),
  });
  return {
    async start() {
      await discover();
      const result = await request(
        endpoints.device,
        form({
          client_id: options.clientId,
          scope: options.ownModel ? OWN_MODEL_SCOPE : IDENTITY_SCOPE,
          referrer: 'reinforce',
        }),
      );
      if (!result.ok)
        throw new XaiAuthFailure(result.status >= 500 || result.status === 429 ? 'unavailable' : 'refused');
      const parsed = deviceSchema.safeParse(result.body);
      if (!parsed.success) throw new XaiAuthFailure('invalid-response');
      const d = parsed.data;
      verificationUrl(d.verification_uri);
      return {
        deviceCode: d.device_code,
        userCode: d.user_code,
        url: verificationUrl(d.verification_uri_complete ?? d.verification_uri),
        expiresIn: Math.min(1800, d.expires_in),
        intervalMs: Math.max(5, d.interval ?? 5) * 1000,
      };
    },
    async poll(deviceCode) {
      try {
        await discover();
        const result = await request(
          endpoints.token,
          form({
            client_id: options.clientId,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
          }),
        );
        if (result.ok) {
          const parsed = xaiTokensSchema.safeParse(result.body);
          return parsed.success ? { kind: 'authorized', tokens: parsed.data } : { kind: 'denied' };
        }
        const error = z.object({ error: z.string() }).safeParse(result.body);
        if (error.success) {
          if (error.data.error === 'authorization_pending') return { kind: 'pending' };
          if (error.data.error === 'slow_down') return { kind: 'slow-down' };
          if (error.data.error === 'expired_token') return { kind: 'expired' };
        }
        if (result.status === 429) return { kind: 'slow-down' };
        return { kind: result.status >= 500 ? 'unavailable' : 'denied' };
      } catch {
        return { kind: 'unavailable' };
      }
    },
    async refresh(refreshToken) {
      await discover();
      const result = await request(
        endpoints.token,
        form({ client_id: options.clientId, grant_type: 'refresh_token', refresh_token: refreshToken }),
      );
      if (!result.ok)
        throw new XaiAuthFailure(result.status >= 500 || result.status === 429 ? 'unavailable' : 'refused');
      const parsed = xaiTokensSchema.safeParse(result.body);
      if (!parsed.success) throw new XaiAuthFailure('invalid-response');
      return parsed.data;
    },
    async verify(raw, now) {
      const tokens = xaiTokensSchema.parse(raw);
      await discover();
      let claims: z.infer<typeof profileSchema> | undefined;
      if (tokens.id_token) {
        try {
          const { payload } = await jwtVerify(tokens.id_token, keys, {
            issuer: XAI_ISSUER,
            audience: options.clientId,
            algorithms: ['ES256'],
            requiredClaims: ['sub', 'exp', 'iat'],
            clockTolerance: 5,
            currentDate: new Date(now),
          });
          if (
            typeof payload.iat !== 'number' ||
            payload.iat > now / 1000 + 5 ||
            (payload.azp !== undefined && payload.azp !== options.clientId) ||
            (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== options.clientId)
          )
            throw new Error('Invalid claims');
          if (payload.at_hash !== undefined) {
            const expected = createHash('sha256')
              .update(tokens.access_token, 'ascii')
              .digest()
              .subarray(0, 16)
              .toString('base64url');
            const actual = typeof payload.at_hash === 'string' ? payload.at_hash : '';
            if (
              Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
              !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
            )
              throw new Error('Invalid token binding');
          }
          claims = profileSchema.parse(payload);
        } catch {
          throw new XaiAuthFailure('invalid-identity');
        }
      }
      let result: Awaited<ReturnType<typeof request>> | undefined;
      try {
        result = await request(endpoints.userinfo, {
          headers: { authorization: `Bearer ${tokens.access_token}` },
        });
      } catch {
        if (!claims) throw new XaiAuthFailure('unavailable');
      }
      let profile = claims;
      if (result?.ok) {
        const parsed = profileSchema.safeParse(result.body);
        if (!parsed.success || (claims && parsed.data.sub !== claims.sub))
          throw new XaiAuthFailure('invalid-identity');
        profile = parsed.data;
      }
      if (!profile) throw new XaiAuthFailure('invalid-identity');
      return {
        issuer: XAI_ISSUER,
        subject: profile.sub,
        // Without a name of its own the account is called by the page in its language.
        name:
          profile.name
            ?.replace(/\p{Cc}/gu, '')
            .trim()
            .slice(0, 200) ?? '',
      };
    },
  };
}
