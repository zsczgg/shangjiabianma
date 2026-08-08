import { z } from 'zod';

export const DEFAULT_PRINT_TIME_SETTINGS = {
  position: 'bottom-right' as const,
  fontSize: 1.5,
  parts: { year: true, month: true, day: true, hour: true, minute: true, second: true },
};

export const DEFAULT_PRINT_SEQUENCE_SETTINGS = {
  position: 'bottom-left' as const,
  fontSize: 1.8,
};

export const DEFAULT_LABEL_FONT_SIZES = {
  '40x30': { brand: 2.5, caption: 1.35, productName: 2.15, spec: 1.75, internalCode: 2.8, barcodeText: 1.5, externalCode: 1.15, externalBarcodeText: 1.1, note: 1.15, time: 1.2, sequence: 1.4 },
  '70x50': { brand: 3.4, caption: 1.9, productName: 2.9, spec: 2.3, internalCode: 4, barcodeText: 2, externalCode: 1.75, externalBarcodeText: 1.5, note: 1.5, time: 1.5, sequence: 1.8 },
  '100x100': { brand: 5, caption: 1.9, productName: 5, spec: 3.5, internalCode: 6.2, barcodeText: 2.4, externalCode: 2.1, externalBarcodeText: 1.9, note: 2.2, time: 2, sequence: 2.3 },
};

const fontSizeSchema = z.object({
  brand: z.number().min(.8).max(10),
  caption: z.number().min(.8).max(10),
  productName: z.number().min(.8).max(10),
  spec: z.number().min(.8).max(10),
  internalCode: z.number().min(.8).max(10),
  barcodeText: z.number().min(.8).max(10),
  externalCode: z.number().min(.8).max(10),
  externalBarcodeText: z.number().min(.8).max(10),
  note: z.number().min(.8).max(10),
  time: z.number().min(.8).max(10),
  sequence: z.number().min(.8).max(10),
});

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
    time: z.boolean().default(true),
    sequence: z.boolean().default(true),
  }),
  printTime: z.object({
    position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']),
    fontSize: z.number().min(1).max(4),
    parts: z.object({
      year: z.boolean(), month: z.boolean(), day: z.boolean(),
      hour: z.boolean(), minute: z.boolean(), second: z.boolean(),
    }),
  }).default(DEFAULT_PRINT_TIME_SETTINGS),
  printSequence: z.object({
    position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']),
    fontSize: z.number().min(1).max(4),
  }).default(DEFAULT_PRINT_SEQUENCE_SETTINGS),
  fontSizes: z.object({
    '40x30': fontSizeSchema,
    '70x50': fontSizeSchema,
    '100x100': fontSizeSchema,
  }).default(DEFAULT_LABEL_FONT_SIZES),
  calibration: z.object({
    x: z.number().min(-5).max(5),
    y: z.number().min(-5).max(5),
  }),
});

export const labelSettingsSchema = z.preprocess(value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const legacy = value as Record<string, unknown>;
  const fields = legacy.fields as Record<string, unknown> | undefined;
  const customNote = typeof legacy.customNote === 'string' ? legacy.customNote : '';
  const legacyPrintTime = legacy.printTime as { fontSize?: number } | undefined;
  const legacyPrintSequence = legacy.printSequence as { fontSize?: number } | undefined;
  const fontSizes = legacy.fontSizes as Partial<typeof DEFAULT_LABEL_FONT_SIZES> | undefined;
  const migratedFontSizes = Object.fromEntries(
    (['40x30', '70x50', '100x100'] as const).map(paper => [paper, {
      ...DEFAULT_LABEL_FONT_SIZES[paper],
      time: legacyPrintTime?.fontSize ?? DEFAULT_LABEL_FONT_SIZES[paper].time,
      sequence: legacyPrintSequence?.fontSize ?? DEFAULT_LABEL_FONT_SIZES[paper].sequence,
      ...fontSizes?.[paper],
    }]),
  );
  return {
    ...legacy,
    noteSource: legacy.noteSource || (fields?.note === false ? 'none' : customNote.trim() ? 'custom' : 'product'),
    fields: {
      ...fields,
      time: typeof fields?.time === 'boolean' ? fields.time : true,
      sequence: typeof fields?.sequence === 'boolean' ? fields.sequence : true,
    },
    printTime: legacy.printTime || DEFAULT_PRINT_TIME_SETTINGS,
    printSequence: legacy.printSequence || DEFAULT_PRINT_SEQUENCE_SETTINGS,
    fontSizes: migratedFontSizes,
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
    time: true,
    sequence: true,
  },
  printTime: DEFAULT_PRINT_TIME_SETTINGS,
  printSequence: DEFAULT_PRINT_SEQUENCE_SETTINGS,
  fontSizes: DEFAULT_LABEL_FONT_SIZES,
  calibration: { x: 0, y: 0 },
};
