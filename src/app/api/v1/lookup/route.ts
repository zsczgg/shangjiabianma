import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  apiError,
  apiSuccess,
  integrationSkuInclude,
  requireIntegrationApiKey,
  serializeSku,
  type IntegrationSku,
} from '@/lib/integration-api';

export const dynamic = 'force-dynamic';

type Match = { matchedBy: string; sku: IntegrationSku };

export async function GET(request: NextRequest) {
  const unauthorized = await requireIntegrationApiKey(request);
  if (unauthorized) return unauthorized;
  const code = request.nextUrl.searchParams.get('code')?.trim();
  if (!code) return apiError('CODE_REQUIRED', '必须提供 code 查询参数', 400);

  try {
    const matches: Match[] = [];
    const seen = new Set<string>();
    const add = (matchedBy: string, skus: IntegrationSku[]) => {
      for (const sku of skus) {
        if (seen.has(sku.id)) continue;
        seen.add(sku.id);
        matches.push({ matchedBy, sku });
      }
    };

    const internalSku = await prisma.sku.findUnique({ where: { internalCode: code }, include: integrationSkuInclude });
    if (internalSku) add('INTERNAL_CODE', [internalSku]);

    const external = await prisma.externalCode.findUnique({
      where: { value: code },
      include: { sku: { include: integrationSkuInclude } },
    });
    if (external) add(external.type === 'BARCODE' ? 'MANUFACTURER_BARCODE' : external.type === 'CAINIAO' ? 'WAREHOUSE_CODE' : 'EXTERNAL_CODE', [external.sku]);

    const product = await prisma.product.findUnique({
      where: { cainiaoCode: code },
      include: { skus: { include: integrationSkuInclude } },
    });
    if (product) add('PRODUCT_WAREHOUSE_CODE', product.skus);

    const mappings = await prisma.channelSkuMapping.findMany({
      where: { OR: [{ externalSkuId: code }, { merchantCode: code }, { listing: { productExternalId: code } }] },
      include: { sku: { include: integrationSkuInclude }, listing: true },
    });
    for (const mapping of mappings) {
      const matchedBy = mapping.externalSkuId === code
        ? 'PLATFORM_SKU_ID'
        : mapping.merchantCode === code
          ? 'MERCHANT_CODE'
          : 'PLATFORM_PRODUCT_ID';
      add(matchedBy, [mapping.sku]);
    }

    if (!matches.length) return apiError('CODE_NOT_FOUND', '没有找到该编码对应的商品规格', 404);
    return apiSuccess(matches.map(match => ({ matchedBy: match.matchedBy, ...serializeSku(match.sku) })), { count: matches.length });
  } catch (error) {
    console.error('integration API lookup failed', error);
    return apiError('INTERNAL_ERROR', '编码查询失败', 500);
  }
}
