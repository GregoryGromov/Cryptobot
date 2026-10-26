import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const newId = (): string => randomUUID();
export const newToken = (): string => randomBytes(32).toString('base64url');
export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/** Canonical DTO v1: sorted object keys, preserved array order, JSON finite primitives. */
export function canonical(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  throw new Error('Only JSON DTOs can be hashed');
}
export const payloadHash = (value: unknown): string => sha256(canonical(value));
