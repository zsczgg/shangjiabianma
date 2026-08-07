import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { productImageDirectory } from '@/lib/product-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedFilename = /^[0-9a-f-]+\.(jpg|png|webp)$/i;
const contentTypes: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function GET(_: Request, { params }: { params: { filename: string } }) {
  if (!allowedFilename.test(params.filename)) return new NextResponse('Not found', { status: 404 });
  try {
    const data = await readFile(path.join(productImageDirectory(), params.filename));
    const extension = params.filename.split('.').pop()!.toLowerCase();
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentTypes[extension],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
