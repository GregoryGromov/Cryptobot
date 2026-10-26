import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';

const envelope = z.strictObject({
  v: z.literal(1),
  iv: z.string(),
  tag: z.string(),
  data: z.string(),
});
export function secretBox(encodedKey: string) {
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('Invalid encryption key');
  return {
    seal(value: unknown, context: string): string {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(context));
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return JSON.stringify({
        v: 1,
        iv: iv.toString('base64url'),
        tag: cipher.getAuthTag().toString('base64url'),
        data: encrypted.toString('base64url'),
      });
    },
    open(value: string, context: string): unknown {
      try {
        const data = envelope.parse(JSON.parse(value));
        const iv = Buffer.from(data.iv, 'base64url');
        const tag = Buffer.from(data.tag, 'base64url');
        if (iv.length !== 12 || tag.length !== 16) throw new Error('Invalid envelope');
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAAD(Buffer.from(context));
        decipher.setAuthTag(tag);
        return JSON.parse(
          Buffer.concat([decipher.update(Buffer.from(data.data, 'base64url')), decipher.final()]).toString(
            'utf8',
          ),
        );
      } catch {
        throw new Error('Secret could not be decrypted');
      }
    },
  };
}
