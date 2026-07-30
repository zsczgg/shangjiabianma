import { describe, expect, it } from 'vitest';
import { DEFAULT_LABEL_SETTINGS, labelSettingsSchema } from './label-settings';

describe('label settings', () => {
  it('accepts the complete default settings', () => {
    expect(labelSettingsSchema.parse(DEFAULT_LABEL_SETTINGS)).toEqual(DEFAULT_LABEL_SETTINGS);
  });

  it('accepts the compact 40x30 paper size', () => {
    expect(labelSettingsSchema.parse({
      ...DEFAULT_LABEL_SETTINGS,
      paper: '40x30',
    }).paper).toBe('40x30');
  });

  it('rejects unsafe calibration', () => {
    expect(() => labelSettingsSchema.parse({
      ...DEFAULT_LABEL_SETTINGS,
      calibration: { x: 20, y: 0 },
    })).toThrow();
  });
});
