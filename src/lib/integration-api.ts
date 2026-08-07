import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { absoluteImageUrl, imageSource } from './product-image';

export const API_VERSION = 'v1';
export const MAX_PAGE_SIZE = 100;
export const LEGACY_API_KEY_SETTING = 'legacy-integration-api-key-enabled';

export const integrationSkuInclude = {
  product: { include: { listings: true } },
  externalCodes: true,
  channelMappings: { include: { listing: true } },
} satisfies Prisma.SkuInclude;

export type IntegrationSku = Prisma.SkuGetPayload<{ include: typeof integrationSkuInclude }>;

export function generateApiKey() {
  return `yyapi_${randomBytes(32).toString('base64url')}`;
}

export function hashApiKey(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function verifyApiKey(provided: string | null, configured = process.env.INTEGRATION_API_KEY) {
  if (!provided || !configured) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(configured);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function authenticateIntegrationApiKey(provided: string | null) {
  if (!provided) return false;

  const credential = await prisma.apiCredential.findUnique({ where: { keyHash: hashApiKey(provided) } });
  if (credential?.status === 'ACTIVE') {
    const stale = !credential.lastUsedAt || Date.now() - credential.lastUsedAt.getTime() > 60_000;
    if (stale) {
      await prisma.apiCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } });
    }
    return true;
  }

  const legacy = process.env.INTEGRATION_API_KEY;
  if (!legacy || !verifyApiKey(provided, legacy)) return false;
  const setting = await prisma.appSetting.findUnique({ where: { key: LEGACY_API_KEY_SETTING } });
  return setting?.value !== 'false';
}

export async function requireIntegrationApiKey(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
  const provided = request.headers.get('x-api-key') || bearer;

  if (!await authenticateIntegrationApiKey(provided)) {
    return apiError('UNAUTHORIZED', '缺少、无效或已经停用的 API Key', 401);
  }
  return null;
}

export function parsePagination(searchParams: URLSearchParams) {
  const rawPage = Number(searchParams.get('page') || '1');
  const rawPageSize = Number(searchParams.get('pageSize') || '50');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Number.isInteger(rawPageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))
    : 50;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function serializeSku(sku: IntegrationSku, origin = '') {
  const manufacturerBarcode = sku.externalCodes.find(code => code.type === 'BARCODE')?.value || null;
  const warehouseCode = sku.externalCodes.find(code => code.type === 'CAINIAO')?.value || null;
  const otherCodes = sku.externalCodes
    .filter(code => !['BARCODE', 'CAINIAO'].includes(code.type))
    .map(code => ({ type: code.type, label: code.label, value: code.value }));

  return {
    skuId: sku.id,
    internalCode: sku.internalCode,
    spec: sku.spec,
    status: sku.status,
    warning: sku.status === 'INACTIVE' || sku.product.status === 'INACTIVE'
      ? '该商品或规格已经停用，仅供历史追溯，禁止用于新业务'
      : null,
    createdAt: sku.createdAt.toISOString(),
    product: {
      productId: sku.product.id,
      name: sku.product.name,
      brand: sku.product.brand,
      category: sku.product.category,
      imageUrl: origin ? absoluteImageUrl(sku.product.imageUrl, origin) : sku.product.imageUrl,
      imageSource: imageSource(sku.product.imageUrl),
      note: sku.product.note,
      status: sku.product.status,
      warehouseCode: sku.product.cainiaoCode,
      createdAt: sku.product.createdAt.toISOString(),
      updatedAt: sku.product.updatedAt.toISOString(),
    },
    codes: { manufacturerBarcode, warehouseCode, otherCodes },
    platformMappings: sku.channelMappings.map(mapping => ({
      channel: mapping.listing.channel,
      shop: mapping.listing.shop,
      platformProductId: mapping.listing.productExternalId,
      platformSkuId: mapping.externalSkuId,
      merchantCode: mapping.merchantCode,
      status: mapping.listing.status,
    })),
  };
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
