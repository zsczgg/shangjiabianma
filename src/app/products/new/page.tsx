'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VerifiedCodeInput from '@/components/verified-code-input';
import ProductImageInput from '@/components/product-image-input';
import { DEFAULT_SCAN_VERIFICATION_SETTINGS, type ScanVerificationSettings } from '@/lib/scan-verification-settings';

type Row = { id: string; spec: string; barcode: string; cainiao: string };
type Listing = { id: string; channel: string; shop: string; productExternalId: string };
const channels = ['淘宝', '闲鱼', '小红书', '其他'];
let rowSequence = 1;
const makeRow = (): Row => ({ id: `row-${rowSequence++}`, spec: '', barcode: '', cainiao: '' });
const makeListing = (): Listing => ({ id: `listing-${rowSequence++}`, channel: '淘宝', shop: '', productExternalId: '' });

export default function NewProduct() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...makeRow(), spec: '默认规格' }]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [productWarehouseCode, setProductWarehouseCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [settings, setSettings] = useState<ScanVerificationSettings>(DEFAULT_SCAN_VERIFICATION_SETTINGS);
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/scan-verification-settings', { cache: 'no-store' })
      .then(async response => response.ok ? (await response.json()).settings : DEFAULT_SCAN_VERIFICATION_SETTINGS)
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SCAN_VERIFICATION_SETTINGS));
  }, []);

  function verificationEnabled(field: keyof Omit<ScanVerificationSettings, 'enabled'>) {
    return settings.enabled && settings[field];
  }

  function setFieldVerified(key: string, verified: boolean) {
    setVerifiedFields(current => {
      const next = new Set(current);
      if (verified) next.add(key); else next.delete(key);
      return next;
    });
  }

  function hasUnverifiedCodes() {
    const checks = [
      { key: 'product-warehouse', value: productWarehouseCode, enabled: verificationEnabled('productWarehouseCode') },
      ...listings.map(item => ({ key: `listing-${item.id}`, value: item.productExternalId, enabled: verificationEnabled('platformProductId') })),
      ...rows.flatMap(item => [
        { key: `barcode-${item.id}`, value: item.barcode, enabled: verificationEnabled('manufacturerBarcode') },
        { key: `warehouse-${item.id}`, value: item.cainiao, enabled: verificationEnabled('skuWarehouseCode') },
      ]),
    ];
    return checks.some(item => item.enabled && item.value.trim() && !verifiedFields.has(item.key));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasUnverifiedCodes()) {
      setError('还有编码没有完成二次扫描验证，请逐项验证后再保存。');
      return;
    }
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get('name'), brand: form.get('brand'), category: form.get('category'), imageUrl, note: form.get('note'),
      cainiaoCode: productWarehouseCode,
      skus: rows.map(({ spec, barcode, cainiao }) => ({ spec, barcode, cainiao })),
      listings: listings.map(({ channel, shop, productExternalId }) => ({ channel, shop, productExternalId })),
    };
    const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); setSaving(false); } else router.push(`/products/${data.id}`);
  }

  function preventEnterSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) event.preventDefault();
  }

  return <div className="page">
    <span className="eyebrow">CREATE PRODUCT</span><h1>新建商品</h1><p className="sub">建立商品信息并一次录入全部规格和平台店铺关系。</p>
    {settings.enabled && <div className="scan-verification-notice">编码二次验证已开启。带验证的编码第一次录入完成后，需要再次扫描确认。</div>}
    <form onSubmit={submit} onKeyDown={preventEnterSubmit}>
      <div className="grid2">
        <section className="card form-card"><h2>01 · 商品信息</h2><div className="field"><label>商品名称 *</label><input name="name" required placeholder="例如：轻氧云感防晒外套"/></div><div className="grid2"><div className="field"><label>品牌</label><input name="brand"/></div><div className="field"><label>分类</label><input name="category"/></div></div><div className="field"><label>商品图片</label><ProductImageInput value={imageUrl} onChange={setImageUrl}/></div><div className="field"><label>备注</label><textarea name="note"/></div></section>
        <section className="card form-card"><div className="detail-head"><div><h2>02 · 平台商品</h2><p className="sub">同一商品可绑定多个平台和店铺关系。</p></div><button type="button" className="primary" onClick={() => setListings([...listings, makeListing()])}>＋ 添加平台</button></div>{!listings.length && <div className="empty" style={{ padding: 30 }}>尚未添加平台商品，可稍后编辑</div>}{listings.map((listing, index) => <div className="platform-row" key={listing.id}><div className="field"><label>平台</label><select value={listing.channel} onChange={event => setListings(listings.map((item, itemIndex) => itemIndex === index ? { ...item, channel: event.target.value } : item))}>{channels.map(channel => <option key={channel}>{channel}</option>)}</select></div><div className="field"><label>店铺名称</label><input value={listing.shop} onChange={event => setListings(listings.map((item, itemIndex) => itemIndex === index ? { ...item, shop: event.target.value } : item))}/></div><div className="field"><label>平台商品 ID *</label><VerifiedCodeInput value={listing.productExternalId} required label="平台商品 ID" verificationEnabled={verificationEnabled('platformProductId')} onChange={value => setListings(listings.map((item, itemIndex) => itemIndex === index ? { ...item, productExternalId: value } : item))} onVerificationChange={verified => setFieldVerified(`listing-${listing.id}`, verified)} onMismatch={setError}/></div><button type="button" onClick={() => setListings(listings.filter((_, itemIndex) => itemIndex !== index))}>移除</button></div>)}</section>
      </div>
      <section className="card form-card" style={{ marginTop: 18 }}><h2>03 · 商品级仓配编码</h2><p className="sub">适合单规格商品，可留空后续补充。</p><div className="field" style={{ maxWidth: 520 }}><label>商品级仓配编码</label><VerifiedCodeInput value={productWarehouseCode} label="商品级仓配编码" placeholder="扫描或粘贴仓配商品编码" verificationEnabled={verificationEnabled('productWarehouseCode')} onChange={setProductWarehouseCode} onVerificationChange={verified => setFieldVerified('product-warehouse', verified)} onMismatch={setError}/></div></section>
      <section className="card form-card" style={{ marginTop: 18 }}><div className="detail-head"><div><h2>04 · 规格 SKU</h2><p className="sub">颜色、尺码或容量不同，都应单独建立一行。</p></div><button type="button" className="primary" onClick={() => setRows([...rows, makeRow()])}>＋ 添加规格</button></div>{rows.map((row, index) => <div className="sku-row" key={row.id}><div className="field"><label>规格名称 *</label><input value={row.spec} required onChange={event => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, spec: event.target.value } : item))}/></div><div className="field"><label>厂家条码</label><VerifiedCodeInput value={row.barcode} label="厂家条码" verificationEnabled={verificationEnabled('manufacturerBarcode')} onChange={value => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, barcode: value } : item))} onVerificationChange={verified => setFieldVerified(`barcode-${row.id}`, verified)} onMismatch={setError}/></div><div className="field"><label>仓配编码</label><VerifiedCodeInput value={row.cainiao} label="规格仓配编码" verificationEnabled={verificationEnabled('skuWarehouseCode')} onChange={value => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, cainiao: value } : item))} onVerificationChange={verified => setFieldVerified(`warehouse-${row.id}`, verified)} onMismatch={setError}/></div>{rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, itemIndex) => itemIndex !== index))}>移除</button>}</div>)}{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="primary" disabled={saving}>{saving ? '正在保存…' : '保存并生成内部编码'}</button></section>
    </form>
  </div>;
}
