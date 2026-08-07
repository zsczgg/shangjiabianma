export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_PREFIX = '/uploads/products/';

export function productImageDirectory() {
  return process.env.PRODUCT_IMAGE_DIR || `${process.cwd()}/data/uploads/products`;
}

const imageTypes = {
  'image/jpeg': { extension: 'jpg', signatures: [[0xff, 0xd8, 0xff]] },
  'image/png': { extension: 'png', signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/webp': { extension: 'webp', signatures: [[0x52, 0x49, 0x46, 0x46]] },
} as const;

export type SupportedImageType = keyof typeof imageTypes;

function startsWith(buffer: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

export function detectProductImageType(buffer: Uint8Array, declaredType: string) {
  const config = imageTypes[declaredType as SupportedImageType];
  if (!config || !config.signatures.some(signature => startsWith(buffer, signature))) return null;
  if (declaredType === 'image/webp') {
    const webp = String.fromCharCode(...buffer.slice(8, 12)) === 'WEBP';
    if (!webp) return null;
  }
  return { mimeType: declaredType as SupportedImageType, extension: config.extension };
}

export function imageSource(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  return imageUrl.startsWith(PRODUCT_IMAGE_PREFIX) ? 'UPLOAD' : 'URL';
}

export function absoluteImageUrl(imageUrl: string | null | undefined, origin: string) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return new URL(imageUrl, origin).toString();
}
