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
export type LabelProductGroup = { productId: string; productName: string; brand: string | null; items: LabelItem[] };

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

export function applyUnifiedQuantity(quantities: QueueQuantities, quantity: number) {
  const normalized = Math.max(1, Math.floor(quantity));
  return Object.fromEntries(Object.keys(quantities).map(skuId => [skuId, normalized]));
}

export function groupLabelItems(items: LabelItem[]) {
  const groups = new Map<string, LabelProductGroup>();
  for (const item of items) {
    const group = groups.get(item.productId) || { productId: item.productId, productName: item.productName, brand: item.brand, items: [] };
    group.items.push(item);
    groups.set(item.productId, group);
  }
  return Array.from(groups.values());
}
