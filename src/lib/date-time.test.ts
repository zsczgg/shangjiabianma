import { describe, expect, it } from 'vitest';
import { formatBeijingTime } from './date-time';

describe('Beijing time formatting', () => {
  it('always uses Asia/Shanghai regardless of server timezone', () => {
    expect(formatBeijingTime('2026-08-07T00:00:00.000Z')).toContain('08:00:00');
  });
});
