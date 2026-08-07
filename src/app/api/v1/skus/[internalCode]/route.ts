import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  apiError,
  apiSuccess,
  integrationSkuInclude,
  requireIntegrationApiKey,
  serializeSku,
} from '@/lib/integration-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { internalCode: string } }) {
  const unauthorized = await requireIntegrationApiKey(request);
  if (unauthorized) return unauthorized;

  try {
    const internalCode = decodeURIComponent(params.internalCode).trim();
    const sku = await prisma.sku.findUnique({
      where: { internalCode },
      include: integrationSkuInclude,
    });
    if (!sku) return apiError('SKU_NOT_FOUND', '没有找到该内部编码', 404);
    return apiSuccess(serializeSku(sku, request.nextUrl.origin));
  } catch (error) {
    console.error('integration API detail failed', error);
    return apiError('INTERNAL_ERROR', '读取 SKU 数据失败', 500);
  }
}
