import { describe, expect, it } from 'vitest';
import { DEFAULT_SCAN_VERIFICATION_SETTINGS, scanVerificationSettingsSchema } from './scan-verification-settings';

describe('scan verification settings', () => {
  it('accepts the default settings', () => {
    expect(scanVerificationSettingsSchema.parse(DEFAULT_SCAN_VERIFICATION_SETTINGS)).toEqual(DEFAULT_SCAN_VERIFICATION_SETTINGS);
  });

  it('requires every individual switch', () => {
    expect(() => scanVerificationSettingsSchema.parse({ enabled: true })).toThrow();
  });
});
