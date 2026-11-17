import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

export interface EncryptionService {
  encrypt(value: string, context: string): string;
  decrypt(value: string, context: string): string;
}

/** Authenticated, versioned ciphertext. Context prevents swapping tokens between users or fields. */
export function createEncryptionService(secret: string): EncryptionService {
  const key = /^[a-fA-F0-9]{64}$/.test(secret) ? Buffer.from(secret, 'hex') : Buffer.from(secret, 'utf8');
  if (key.length !== 32) throw new Error('Encryption requires a 32-byte key.');

  return {
    encrypt(value, context) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(context, 'utf8'));
      const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      return [VERSION, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'),
        ciphertext.toString('base64url')].join('.');
    },
    decrypt(value, context) {
      try {
        const parts = value.split('.');
        if (parts.length !== 4 || parts[0] !== VERSION ||
          !parts.slice(1, 3).every((part) => /^[A-Za-z0-9_-]+$/.test(part)) ||
          !/^[A-Za-z0-9_-]*$/.test(parts[3])) throw new Error();
        const [, encodedIv, encodedTag, encodedCiphertext] = parts;
        const iv = Buffer.from(encodedIv, 'base64url');
        const tag = Buffer.from(encodedTag, 'base64url');
        if (iv.length !== 12 || tag.length !== 16) throw new Error();
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAAD(Buffer.from(context, 'utf8'));
        decipher.setAuthTag(tag);
        return Buffer.concat([
          decipher.update(Buffer.from(encodedCiphertext, 'base64url')), decipher.final(),
        ]).toString('utf8');
      } catch {
        // Never include ciphertext, plaintext, keys, or low-level crypto errors.
        throw new Error('Encrypted data could not be authenticated.');
      }
    },
  };
}
