import { describe, expect, it } from 'vitest';
import { formatInternalCode } from './internal-code';
describe('internal code', () => {
  it('formats fixed prefix and six digits', () => expect(formatInternalCode(1)).toBe('yyhxfz000001'));
  it('keeps upper boundary', () => expect(formatInternalCode(999999)).toBe('yyhxfz999999'));
  it('rejects overflow', () => expect(() => formatInternalCode(1000000)).toThrow());
});
