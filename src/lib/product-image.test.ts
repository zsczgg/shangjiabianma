import { describe, expect, it } from 'vitest';
import { absoluteImageUrl, detectProductImageType, imageSource } from './product-image';

describe('product images', () => {
  it('detects supported image signatures', () => {
    expect(detectProductImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg')?.extension).toBe('jpg');
    expect(detectProductImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png')?.extension).toBe('png');
    expect(detectProductImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), 'image/webp')?.extension).toBe('webp');
    expect(detectProductImageType(new Uint8Array([1, 2, 3]), 'image/jpeg')).toBeNull();
  });

  it('normalizes uploaded image URLs for API consumers', () => {
    expect(imageSource('/uploads/products/a.jpg')).toBe('UPLOAD');
    expect(imageSource('https://example.com/a.jpg')).toBe('URL');
    expect(absoluteImageUrl('/uploads/products/a.jpg', 'https://inventory.example.com')).toBe('https://inventory.example.com/uploads/products/a.jpg');
  });
});
