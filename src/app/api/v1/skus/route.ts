import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  apiError,
  apiSuccess,
  integrationSkuInclude,
  parsePagination,
  requireIntegrationApiKey,
  serializeSku,
} from '@/lib/integration-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = await requireIntegrationApiKey(request);
  if (unauthorized) return unauthorized;

  try {
    const params = request.nextUrl.searchParams;
    const { page, pageSize, skip } = parsePagination(params);
    const query = params.get('query')?.trim() || '';
    const status = params.get('status')?.toUpperCase() || 'ACTIVE';
    if (!['ACTIVE', 'INACTIVE', 'ALL'].includes(status)) {
      return apiError('INVALID_STATUS', 'status 只能是 ACTIVE、INACTIVE 或 ALL', 400);
    }

    const where: Prisma.SkuWhereInput = {
      ...(status === 'ALL' ? {} : { status, product: { status } }),
      ...(query ? {
        OR: [
          { internalCode: { contains: query } },
          { spec: { contains: query } },
          { product: { name: { contains: query } } },
          { product: { brand: { contains: query } } },
          { product: { cainiaoCode: { contains: query } } },
          { externalCodes: { some: { value: { contains: query } } } },
          { channelMappings: { some: { OR: [
            { externalSkuId: { contains: query } },
            { merchantCode: { contains: query } },
            { listing: { productExternalId: { contains: query } } },
          ] } } },
        ],
      } : {}),
    };

    const [total, skus] = await prisma.$transaction([
      prisma.sku.count({ where }),
      prisma.sku.findMany({
        where,
        include: integrationSkuInclude,
        orderBy: { internalCode: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);

    return apiSuccess(skus.map(sku => serializeSku(sku, request.nextUrl.origin)), {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('integration API list failed', error);
    return apiError('INTERNAL_ERROR', '读取 SKU 数据失败', 500);
  }
}
