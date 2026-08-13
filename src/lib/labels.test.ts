import { describe, expect, it } from 'vitest';
import { applyUnifiedQuantity, codeByType, expandPrintableItems, groupLabelItems, labelMatchesQuery, resolveLabelEntry, totalLabelCopies, type LabelItem } from './labels';

const item: LabelItem = {
  skuId: 'sku-1',
  productId: 'product-1',
  productName: '轻氧云感防晒外套',
  brand: '媛媛和小肥朱',
  spec: '雾霾蓝 / XL',
  internalCode: 'yyhxfz000128',
  productCainiaoCode: 'CN-PRODUCT-1',
  imageUrl: null,
  note: '夏季新品',
  externalCodes: [
    { type: 'BARCODE', label: '厂家条码', value: '6931234567890' },
    { type: 'CAINIAO', label: '仓配编码', value: 'CN-SKU-1' },
  ],
  platformCodes: [{ channel: '淘宝', shop: '主店', value: '123456789' }],
};

describe('label helpers', () => {
  it('matches product, SKU, warehouse, and platform values', () => {
    expect(labelMatchesQuery(item, '防晒')).toBe(true);
    expect(labelMatchesQuery(item, 'yyhxfz000128')).toBe(true);
    expect(labelMatchesQuery(item, 'CN-SKU-1')).toBe(true);
    expect(labelMatchesQuery(item, '淘宝')).toBe(true);
    expect(labelMatchesQuery(item, '不存在')).toBe(false);
  });

  it('finds external codes by type', () => {
    expect(codeByType(item, 'BARCODE')).toBe('6931234567890');
    expect(codeByType(item, 'OTHER')).toBeNull();
  });

  it('calculates and expands requested copies', () => {
    const quantities = { 'sku-1': 2 };
    expect(totalLabelCopies(quantities)).toBe(2);
    expect(expandPrintableItems([item], quantities)).toHaveLength(2);
  });

  it('applies unified copies to every selected SKU', () => {
    expect(applyUnifiedQuantity({ 'sku-1': 1, 'sku-2': 4 }, 3)).toEqual({ 'sku-1': 3, 'sku-2': 3 });
    expect(totalLabelCopies(applyUnifiedQuantity({ 'sku-1': 1, 'sku-2': 4 }, 3))).toBe(6);
  });

  it('groups multiple SKUs under one product', () => {
    const secondSku = { ...item, skuId: 'sku-2', spec: '雾霾蓝 / L', internalCode: 'yyhxfz000129' };
    const groups = groupLabelItems([item, secondSku]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map(sku => sku.skuId)).toEqual(['sku-1', 'sku-2']);
  });

  it('keeps the sidebar entry empty', () => {
    expect(resolveLabelEntry([item])).toMatchObject({ quantities: {}, activeSkuId: '', notice: null });
  });

  it('selects only a valid SKU with one copy', () => {
    expect(resolveLabelEntry([item], 'sku-1')).toMatchObject({ quantities: { 'sku-1': 1 }, activeSkuId: 'sku-1' });
  });

  it('does not fall back to another item for an invalid SKU', () => {
    const entry = resolveLabelEntry([item], 'missing');
    expect(entry.quantities).toEqual({});
    expect(entry.notice?.tone).toBe('error');
  });

  it('expands a multi-SKU product without selecting a specification', () => {
    const secondSku = { ...item, skuId: 'sku-2', spec: 'L', internalCode: 'yyhxfz000129' };
    const entry = resolveLabelEntry([item, secondSku], undefined, 'product-1');
    expect(entry.quantities).toEqual({});
    expect(entry.expandedProductIds).toEqual(['product-1']);
    expect(entry.notice?.tone).toBe('info');
  });

  it('selects the sole SKU from a single-SKU product entry', () => {
    expect(resolveLabelEntry([item], undefined, 'product-1').quantities).toEqual({ 'sku-1': 1 });
  });
});
