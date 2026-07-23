import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allocateInternalCode } from '@/lib/catalog';
import { z } from 'zod';

const listing = z.object({
  channel: z.enum(['淘宝', '闲鱼', '小红书', '其他']),
  shop: z.string().optional(),
  productExternalId: z.string().min(1),
});

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  cainiaoCode: z.string().optional(),
  skus: z.array(z.object({
    spec: z.string().min(1),
    barcode: z.string().optional(),
    cainiao: z.string().optional(),
  })).min(1),
  listings: z.array(listing).default([]),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const productCode = data.cainiaoCode?.trim() || null;
    const skuCodes = data.skus.map(s => s.cainiao?.trim()).filter(Boolean) as string[];
    const barcodes = data.skus.map(s => s.barcode?.trim()).filter(Boolean) as string[];
    const submittedExternalCodes = [...skuCodes, ...barcodes];

    if (productCode && skuCodes.includes(productCode)) {
      throw new Error('商品级菜鸟编码不能与规格菜鸟编码相同');
    }
    if (new Set(submittedExternalCodes).size !== submittedExternalCodes.length) {
      throw new Error('同一商品内的厂家条码或菜鸟编码不能重复');
    }

    const product = await prisma.$transaction(async tx => {
      if (productCode) {
        const [productOwner, skuOwner] = await Promise.all([
          tx.product.findUnique({ where: { cainiaoCode: productCode } }),
          tx.externalCode.findUnique({ where: { value: productCode } }),
        ]);
        if (productOwner || skuOwner) throw new Error('该菜鸟编码已被其他商品或规格使用');
      }

      for (const code of submittedExternalCodes) {
        const [productOwner, skuOwner] = await Promise.all([
          tx.product.findUnique({ where: { cainiaoCode: code } }),
          tx.externalCode.findUnique({ where: { value: code } }),
        ]);
        if (productOwner || skuOwner) throw new Error('厂家条码或菜鸟编码已被其他商品或规格使用');
      }

      const skuData = [];
      for (const sku of data.skus) {
        const internalCode = await allocateInternalCode(tx);
        const barcode = sku.barcode?.trim();
        const cainiao = sku.cainiao?.trim();
        skuData.push({
          internalCode,
          spec: sku.spec,
          externalCodes: {
            create: [
              ...(barcode ? [{ type: 'BARCODE', value: barcode, label: '厂家条码' }] : []),
              ...(cainiao ? [{ type: 'CAINIAO', value: cainiao, label: '菜鸟货品编码' }] : []),
            ],
          },
        });
      }

      return tx.product.create({
        data: {
          name: data.name,
          brand: data.brand,
          category: data.category,
          note: data.note,
          cainiaoCode: productCode,
          skus: { create: skuData },
          listings: {
            create: data.listings.map(item => ({
              channel: item.channel,
              shop: item.shop?.trim() || null,
              productExternalId: item.productExternalId.trim(),
            })),
          },
        },
      });
    });

    return NextResponse.json({ id: product.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败';
    return NextResponse.json({
      error: message.includes('Unique constraint') ? '该编码或平台关系已被其他商品使用' : message,
    }, { status: 400 });
  }
}
