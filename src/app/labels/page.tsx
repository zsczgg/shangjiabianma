import { prisma } from '@/lib/prisma';
import type { LabelItem } from '@/lib/labels';
import LabelPrintCenter from './label-print-center';

export const dynamic = 'force-dynamic';

export default async function LabelsPage({ searchParams }: { searchParams: { sku?: string; product?: string } }) {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', skus: { some: { status: 'ACTIVE' } } },
    include: {
      skus: {
        where: { status: 'ACTIVE' },
        include: { externalCodes: true },
        orderBy: { createdAt: 'asc' },
      },
      listings: {
        where: { status: 'ACTIVE' },
        include: { skuMappings: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const items: LabelItem[] = products.flatMap(product =>
    product.skus.map(sku => ({
      skuId: sku.id,
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      spec: sku.spec,
      internalCode: sku.internalCode,
      productCainiaoCode: product.cainiaoCode,
      imageUrl: product.imageUrl,
      note: product.note,
      externalCodes: sku.externalCodes.map(code => ({
        type: code.type,
        label: code.label || code.type,
        value: code.value,
      })),
      platformCodes: product.listings.map(listing => {
        const mapping = listing.skuMappings.find(item => item.skuId === sku.id);
        return {
          channel: listing.channel,
          shop: listing.shop,
          value: mapping?.externalSkuId || mapping?.merchantCode || listing.productExternalId,
        };
      }),
    })),
  );

  return <LabelPrintCenter items={items} initialSkuId={searchParams.sku} initialProductId={searchParams.product} />;
}
