import { describe, expect, it } from 'vitest';
import { codeByType, expandPrintableItems, labelMatchesQuery, totalLabelCopies, type LabelItem } from './labels';

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
    { type: 'CAINIAO', label: '菜鸟货品编码', value: 'CN-SKU-1' },
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
});
