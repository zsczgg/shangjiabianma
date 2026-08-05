import { z } from 'zod';

const labelSettingsObjectSchema = z.object({
  paper: z.enum(['40x30', '70x50', '100x100']),
  defaultCopies: z.number().int().min(1).max(999),
  brandText: z.string().trim().max(30),
  customNote: z.string().max(60),
  noteSource: z.enum(['product', 'custom', 'none']),
  fields: z.object({
    brandName: z.boolean(),
    productName: z.boolean(),
    spec: z.boolean(),
    internalCodeText: z.boolean(),
    barcodeText: z.boolean(),
    manufacturer: z.boolean(),
    cainiao: z.boolean(),
    platforms: z.boolean(),
    image: z.boolean(),
    note: z.boolean(),
  }),
  calibration: z.object({
    x: z.number().min(-5).max(5),
    y: z.number().min(-5).max(5),
  }),
});

export const labelSettingsSchema = z.preprocess(value => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || 'noteSource' in value) return value;
  const legacy = value as Record<string, unknown>;
  const fields = legacy.fields as Record<string, unknown> | undefined;
  const customNote = typeof legacy.customNote === 'string' ? legacy.customNote : '';
  return {
    ...legacy,
    noteSource: fields?.note === false ? 'none' : customNote.trim() ? 'custom' : 'product',
  };
}, labelSettingsObjectSchema);

export type LabelSettings = z.infer<typeof labelSettingsSchema>;
export type LabelFieldSettings = LabelSettings['fields'];
export type LabelPaperSize = LabelSettings['paper'];

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  paper: '70x50',
  defaultCopies: 1,
  brandText: '媛媛和小肥朱',
  customNote: '',
  noteSource: 'product',
  fields: {
    brandName: true,
    productName: true,
    spec: true,
    internalCodeText: true,
    barcodeText: true,
    manufacturer: false,
    cainiao: false,
    platforms: false,
    image: false,
    note: false,
  },
  calibration: { x: 0, y: 0 },
};
