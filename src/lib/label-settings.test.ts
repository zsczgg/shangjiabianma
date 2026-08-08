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

  it('migrates legacy custom-note settings without resetting preferences', () => {
    const { noteSource: _noteSource, ...legacy } = {
      ...DEFAULT_LABEL_SETTINGS,
      customNote: '旧版自定义备注',
      fields: { ...DEFAULT_LABEL_SETTINGS.fields, note: true },
    };
    expect(labelSettingsSchema.parse(legacy).noteSource).toBe('custom');
  });

  it('keeps legacy hidden notes hidden', () => {
    const { noteSource: _noteSource, ...legacy } = {
      ...DEFAULT_LABEL_SETTINGS,
      fields: { ...DEFAULT_LABEL_SETTINGS.fields, note: false },
    };
    expect(labelSettingsSchema.parse(legacy).noteSource).toBe('none');
  });

  it('adds print time defaults to existing saved preferences', () => {
    const { printTime: _printTime, ...legacy } = DEFAULT_LABEL_SETTINGS;
    const parsed = labelSettingsSchema.parse({ ...legacy, fields: { ...legacy.fields, time: undefined } });
    expect(parsed.fields.time).toBe(true);
    expect(parsed.printTime.position).toBe('bottom-right');
    expect(parsed.printTime.parts.second).toBe(true);
  });
});
