import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_TIME_SETTINGS } from './label-settings';
import { formatLabelPrintTime } from './label-time';

describe('label print time', () => {
  it('formats all parts to seconds in the system timezone', () => {
    const instant = '2026-08-08T00:01:02.000Z';
    expect(formatLabelPrintTime(instant, 'Asia/Shanghai', DEFAULT_PRINT_TIME_SETTINGS.parts)).toBe('2026-08-08 08:01:02');
    expect(formatLabelPrintTime(instant, 'Asia/Seoul', DEFAULT_PRINT_TIME_SETTINGS.parts)).toBe('2026-08-08 09:01:02');
  });

  it('supports independently selected date and time parts', () => {
    expect(formatLabelPrintTime('2026-08-08T00:01:02.000Z', 'Asia/Shanghai', {
      year: false, month: true, day: true, hour: true, minute: true, second: false,
    })).toBe('08-08 08:01');
  });
});
