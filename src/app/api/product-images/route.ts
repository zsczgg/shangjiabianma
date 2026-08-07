import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { detectProductImageType, MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_PREFIX, productImageDirectory } from '@/lib/product-image';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get('image');
    if (!(image instanceof File)) return NextResponse.json({ error: '请选择商品图片' }, { status: 400 });
    if (!image.size || image.size > MAX_PRODUCT_IMAGE_BYTES) {
      return NextResponse.json({ error: '图片大小必须在 5 MB 以内' }, { status: 400 });
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    const detected = detectProductImageType(bytes, image.type);
    if (!detected) return NextResponse.json({ error: '仅支持有效的 JPG、PNG 或 WebP 图片' }, { status: 400 });

    const uploadDirectory = productImageDirectory();
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${detected.extension}`;
    await writeFile(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });
    return NextResponse.json({ imageUrl: `${PRODUCT_IMAGE_PREFIX}${filename}` });
  } catch (error) {
    console.error('product image upload failed', error);
    return NextResponse.json({ error: '图片上传失败，请稍后重试' }, { status: 500 });
  }
}
