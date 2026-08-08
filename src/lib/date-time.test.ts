import { describe, expect, it } from 'vitest';
import { formatSystemTime } from './date-time';

describe('system time formatting', () => {
  it('uses the selected system timezone regardless of server timezone', () => {
    expect(formatSystemTime('2026-08-07T00:00:00.000Z', 'Asia/Shanghai')).toContain('08:00:00');
    expect(formatSystemTime('2026-08-07T00:00:00.000Z', 'Asia/Seoul')).toContain('09:00:00');
  });
});
