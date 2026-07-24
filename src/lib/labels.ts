export type LabelExternalCode = {
  type: string;
  label: string;
  value: string;
};

export type LabelPlatformCode = {
  channel: string;
  shop: string | null;
  value: string;
};

export type LabelItem = {
  skuId: string;
  productId: string;
  productName: string;
  brand: string | null;
  spec: string;
  internalCode: string;
  productCainiaoCode: string | null;
  imageUrl: string | null;
  note: string | null;
  externalCodes: LabelExternalCode[];
  platformCodes: LabelPlatformCode[];
};

export type QueueQuantities = Record<string, number>;

export function labelMatchesQuery(item: LabelItem, query: string) {
  const normalized = query.trim().toLocaleLowerCase('zh-CN');
  if (!normalized) return true;

  return [
    item.productName,
    item.brand,
    item.spec,
    item.internalCode,
    item.productCainiaoCode,
    ...item.externalCodes.flatMap(code => [code.label, code.value]),
    ...item.platformCodes.flatMap(code => [code.channel, code.shop, code.value]),
  ].some(value => value?.toLocaleLowerCase('zh-CN').includes(normalized));
}

export function codeByType(item: LabelItem, type: string) {
  return item.externalCodes.find(code => code.type === type)?.value ?? null;
}

export function totalLabelCopies(quantities: QueueQuantities) {
  return Object.values(quantities).reduce((sum, quantity) => sum + Math.max(0, Math.floor(quantity)), 0);
}

export function expandPrintableItems(items: LabelItem[], quantities: QueueQuantities) {
  return items.flatMap(item =>
    Array.from({ length: Math.max(0, Math.floor(quantities[item.skuId] ?? 0)) }, (_, copyIndex) => ({
      ...item,
      copyIndex,
    })),
  );
}
