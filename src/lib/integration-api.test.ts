import { describe, expect, it } from 'vitest';
import { parsePagination, verifyApiKey } from './integration-api';

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
});
