import { describe, expect, it } from 'vitest';
import { generateApiKey, hashApiKey, parsePagination, verifyApiKey } from './integration-api';

describe('integration API helpers', () => {
  it('validates API keys without accepting missing values', () => {
    expect(verifyApiKey('secret', 'secret')).toBe(true);
    expect(verifyApiKey('wrong', 'secret')).toBe(false);
    expect(verifyApiKey(null, 'secret')).toBe(false);
    expect(verifyApiKey('secret', '')).toBe(false);
  });

  it('normalizes pagination and caps page size', () => {
    expect(parsePagination(new URLSearchParams('page=2&pageSize=20'))).toEqual({ page: 2, pageSize: 20, skip: 20 });
    expect(parsePagination(new URLSearchParams('page=-1&pageSize=500'))).toEqual({ page: 1, pageSize: 100, skip: 0 });
    expect(parsePagination(new URLSearchParams('page=x&pageSize=x'))).toEqual({ page: 1, pageSize: 50, skip: 0 });
  });

  it('generates prefixed keys and stable non-plaintext hashes', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^yyapi_[A-Za-z0-9_-]{43}$/);
    expect(hashApiKey(key)).toHaveLength(64);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toContain(key);
  });
});
