import { z } from 'zod';

export const scanVerificationSettingsSchema = z.object({
  enabled: z.boolean(),
  platformProductId: z.boolean(),
  productWarehouseCode: z.boolean(),
  manufacturerBarcode: z.boolean(),
  skuWarehouseCode: z.boolean(),
});

export type ScanVerificationSettings = z.infer<typeof scanVerificationSettingsSchema>;

export const DEFAULT_SCAN_VERIFICATION_SETTINGS: ScanVerificationSettings = {
  enabled: true,
  platformProductId: true,
  productWarehouseCode: true,
  manufacturerBarcode: true,
  skuWarehouseCode: true,
};
