import { describe, expect, it } from 'vitest';
import { decryptApiKey, encryptApiKey } from './api-key-crypto';

const secret = 'test-secret-that-is-definitely-longer-than-32-characters';

describe('API Key encryption', () => {
  it('encrypts and decrypts a key', () => {
    const value = 'yyapi_example-secret-value';
    const encrypted = encryptApiKey(value, secret);
    expect(encrypted).not.toContain(value);
    expect(decryptApiKey(encrypted, secret)).toBe(value);
  });

  it('rejects tampered encrypted data', () => {
    const encrypted = encryptApiKey('yyapi_example', secret);
    expect(() => decryptApiKey(`${encrypted}x`, secret)).toThrow();
  });
});
