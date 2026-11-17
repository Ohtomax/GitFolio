import assert from 'node:assert/strict';
import test from 'node:test';
import { createEncryptionService } from '../dist/utils/encryption.js';

const encryption = createEncryptionService('a'.repeat(32));
const context = 'github:fixture:access';

test('AES-256-GCM round trips tokens with a fresh nonce for each encryption', () => {
  const token = 'fixture-private-github-token';
  const first = encryption.encrypt(token, context);
  const second = encryption.encrypt(token, context);
  assert.notEqual(first, second);
  assert.ok(first.startsWith('v1.'));
  assert.ok(!first.includes(token));
  assert.equal(encryption.decrypt(first, context), token);
  assert.equal(encryption.decrypt(encryption.encrypt('', context), context), '');
  const hexKey = createEncryptionService('ab'.repeat(32));
  assert.equal(hexKey.decrypt(hexKey.encrypt(token, context), context), token);
  assert.equal(encryption.decrypt(encryption.encrypt('Unicode ✓', context), context), 'Unicode ✓');
});

test('rejects swapped fields, wrong keys, damaged tags, nonces, and ciphertext', () => {
  const encrypted = encryption.encrypt('fixture-sensitive-token', context);
  assert.throws(() => encryption.decrypt(encrypted, 'github:other:access'), /could not be authenticated/);
  assert.throws(() => encryption.decrypt(encrypted, 'github:fixture:refresh'), /could not be authenticated/);
  assert.throws(() => createEncryptionService('b'.repeat(32)).decrypt(encrypted, context));
  for (const index of [1, 2, 3]) {
    const parts = encrypted.split('.');
    const bytes = Buffer.from(parts[index], 'base64url');
    bytes[0] ^= 1;
    parts[index] = bytes.toString('base64url');
    assert.throws(() => encryption.decrypt(parts.join('.'), context), {
      message: 'Encrypted data could not be authenticated.',
    });
  }
  for (const invalid of ['', 'plaintext-token', 'v2.a.b.c', 'v1.a.b.c', `${encrypted}.extra`]) {
    assert.throws(() => encryption.decrypt(invalid, context));
  }
  assert.throws(() => createEncryptionService('short'), /32-byte key/);
});
