import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { formatInternalCode } from './internal-code';

export async function allocateInternalCode(tx: Prisma.TransactionClient) {
  while (true) {
    const sequence = await tx.sequence.upsert({
      where: { key: 'sku' },
      create: { key: 'sku', value: 1 },
      update: { value: { increment: 1 } },
    });
    const internalCode = formatInternalCode(sequence.value);
    const existing = await tx.sku.findUnique({ where: { internalCode }, select: { id: true } });
    if (!existing) return internalCode;
  }
}

export async function nextInternalCode() {
  return prisma.$transaction(tx => allocateInternalCode(tx));
}

export async function getCatalog(query = '') {
  return prisma.product.findMany({
    where: query ? { OR:[{name:{contains:query}},{brand:{contains:query}},{skus:{some:{OR:[{internalCode:{contains:query}},{externalCodes:{some:{value:{contains:query}}}}]}}}] } : undefined,
    include:{skus:{include:{externalCodes:true}},listings:true}, orderBy:{updatedAt:'desc'}
  });
}
