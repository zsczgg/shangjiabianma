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
export type LabelEntryState = {
  quantities: QueueQuantities;
  activeSkuId: string;
  expandedProductIds: string[];
  notice: { tone: 'info' | 'error'; text: string } | null;
  key: string;
};

export function resolveLabelEntry(items: LabelItem[], skuId?: string, productId?: string): LabelEntryState {
  if (skuId) {
    const item = items.find(candidate => candidate.skuId === skuId);
    if (!item) return {
      quantities: {}, activeSkuId: '', expandedProductIds: [],
      notice: { tone: 'error', text: '该商品规格不存在或已停用，未加入打印队列。' },
      key: `invalid-sku:${skuId}`,
    };
    return {
      quantities: { [item.skuId]: 1 }, activeSkuId: item.skuId, expandedProductIds: [item.productId], notice: null,
      key: `sku:${item.skuId}`,
    };
  }

  if (productId) {
    const productItems = items.filter(item => item.productId === productId);
    if (!productItems.length) return {
      quantities: {}, activeSkuId: '', expandedProductIds: [],
      notice: { tone: 'error', text: '该商品不存在、已停用或没有可打印规格。' },
      key: `invalid-product:${productId}`,
    };
    if (productItems.length === 1) {
      const item = productItems[0];
      return {
        quantities: { [item.skuId]: 1 }, activeSkuId: item.skuId, expandedProductIds: [productId], notice: null,
        key: `product-single:${productId}:${item.skuId}`,
      };
    }
    return {
      quantities: {}, activeSkuId: '', expandedProductIds: [productId],
      notice: { tone: 'info', text: '该商品有多个规格，请勾选需要打印的规格。' },
      key: `product-multi:${productId}`,
    };
  }

  return { quantities: {}, activeSkuId: '', expandedProductIds: [], notice: null, key: 'empty' };
}

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
