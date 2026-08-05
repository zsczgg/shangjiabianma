'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import VerifiedCodeInput from '@/components/verified-code-input';
import { DEFAULT_SCAN_VERIFICATION_SETTINGS, type ScanVerificationSettings } from '@/lib/scan-verification-settings';

type Status = 'ACTIVE' | 'INACTIVE';
type Sku = { id?: string; clientKey?: string; internalCode?: string; spec: string; barcode: string; cainiao: string; status: Status };
type Listing = { id?: string; clientKey?: string; channel: string; shop: string; productExternalId: string; status: Status };
type Product = { id: string; name: string; brand: string; category: string; imageUrl: string; note: string; cainiaoCode: string; status: Status; skus: Sku[]; listings: Listing[] };
const channels = ['淘宝', '闲鱼', '小红书', '其他'];
let editSequence = 1;
const newKey = (prefix: string) => `${prefix}-${Date.now()}-${editSequence++}`;
const Toggle = ({ status, onClick }: { status: Status; onClick: () => void }) => <button type="button" className={status === 'ACTIVE' ? 'status-active' : 'status-inactive'} onClick={onClick}>{status === 'ACTIVE' ? '使用中 · 点击停用' : '已停用 · 点击启用'}</button>;
const comparableProduct = (product: Product) => JSON.stringify({ ...product, skus: product.skus.map(({ clientKey: _clientKey, ...item }) => item), listings: product.listings.map(({ clientKey: _clientKey, ...item }) => item) });

export default function Editor({ product: initial }: { product: Product }) {
  const original = useRef(initial);
  const [p, setP] = useState<Product>(() => ({
    ...initial,
    skus: initial.skus.map(item => ({ ...item, clientKey: item.id })),
    listings: initial.listings.map(item => ({ ...item, clientKey: item.id })),
  }));
  const [settings, setSettings] = useState<ScanVerificationSettings>(DEFAULT_SCAN_VERIFICATION_SETTINGS);
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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

  function originalListingValue(item: Listing) {
    return item.id ? original.current.listings.find(originalItem => originalItem.id === item.id)?.productExternalId : undefined;
  }

  function originalSkuValue(item: Sku, field: 'barcode' | 'cainiao') {
    return item.id ? original.current.skus.find(originalItem => originalItem.id === item.id)?.[field] : undefined;
  }

  function hasUnverifiedCodes() {
    const productChanged = p.cainiaoCode !== original.current.cainiaoCode;
    const checks = [
      { key: 'product-warehouse', value: p.cainiaoCode, changed: productChanged, enabled: verificationEnabled('productWarehouseCode') },
      ...p.listings.map(item => ({ key: `listing-${item.clientKey}`, value: item.productExternalId, changed: item.productExternalId !== originalListingValue(item), enabled: verificationEnabled('platformProductId') })),
      ...p.skus.flatMap(item => [
        { key: `barcode-${item.clientKey}`, value: item.barcode, changed: item.barcode !== originalSkuValue(item, 'barcode'), enabled: verificationEnabled('manufacturerBarcode') },
        { key: `warehouse-${item.clientKey}`, value: item.cainiao, changed: item.cainiao !== originalSkuValue(item, 'cainiao'), enabled: verificationEnabled('skuWarehouseCode') },
      ]),
    ];
    return checks.some(item => item.enabled && item.changed && item.value.trim() && !verifiedFields.has(item.key));
  }

  async function save() {
    if (hasUnverifiedCodes()) {
      setError('还有修改过的编码没有完成二次扫描验证，请逐项验证后再保存。');
      return;
    }
    setSaving(true); setError('');
    const response = await fetch(`/api/products/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p.name, brand: p.brand || null, category: p.category || null, imageUrl: p.imageUrl || null, note: p.note || null,
        cainiaoCode: p.cainiaoCode || null, status: p.status,
        skus: p.skus.map(({ id, spec, barcode, cainiao, status }) => ({ id, spec, barcode, cainiao, status })),
        listings: p.listings.map(({ id, channel, shop, productExternalId, status }) => ({ id, channel, shop, productExternalId, status })),
      }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error); setSaving(false); } else { router.push(`/products/${p.id}`); router.refresh(); }
  }

  function cancelEditing() {
    const changed = comparableProduct(p) !== comparableProduct(original.current);
    if (changed && !window.confirm('确定放弃本次修改吗？尚未保存的内容将全部丢失。')) return;
    router.push(`/products/${p.id}`);
  }

  return <div className="page">
    <div className="detail-head"><div><span className="eyebrow">EDIT RECORD</span><h1>编辑商品资料</h1><p className="sub">可新增规格；已生成的编码只能停用，永不删除或回收。</p></div><div className="top-actions"><Toggle status={p.status} onClick={() => setP({ ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}/><button type="button" className="quiet-button cancel-edit" onClick={cancelEditing}><ArrowLeft />取消并返回</button><button className="primary save-top" onClick={() => void save()} disabled={saving}>{saving ? '保存中…' : '保存全部修改'}</button></div></div>
    {settings.enabled && <div className="scan-verification-notice">编码二次验证已开启。已有且未修改的编码无需重扫，新增或修改编码需要再次扫描确认。</div>}
    {error && <div className="warning">{error}</div>}
    <div className="grid2">
      <section className="card form-card"><h2>商品信息</h2><div className="field"><label>商品名称 *</label><input value={p.name} onChange={event => setP({ ...p, name: event.target.value })}/></div><div className="grid2"><div className="field"><label>品牌</label><input value={p.brand} onChange={event => setP({ ...p, brand: event.target.value })}/></div><div className="field"><label>分类</label><input value={p.category} onChange={event => setP({ ...p, category: event.target.value })}/></div></div><div className="field"><label>商品图片网址</label><input type="url" value={p.imageUrl} onChange={event => setP({ ...p, imageUrl: event.target.value })} placeholder="https://…（打印标签时可选显示）"/></div><div className="field"><label>备注</label><textarea value={p.note} onChange={event => setP({ ...p, note: event.target.value })}/></div></section>
      <section className="card form-card"><div className="detail-head"><div><h2>平台商品关系</h2><p className="sub">已保存关系不删除，可单独停用。</p></div><button type="button" className="primary" onClick={() => setP({ ...p, listings: [...p.listings, { clientKey: newKey('listing'), channel: '淘宝', shop: '', productExternalId: '', status: 'ACTIVE' }] })}>＋ 添加平台</button></div>{p.listings.map((listing, index) => <div className="platform-row" key={listing.clientKey}><div className="field"><label>平台</label><select value={listing.channel} onChange={event => setP({ ...p, listings: p.listings.map((item, itemIndex) => itemIndex === index ? { ...item, channel: event.target.value } : item) })}>{channels.map(channel => <option key={channel}>{channel}</option>)}</select></div><div className="field"><label>店铺名称</label><input value={listing.shop} onChange={event => setP({ ...p, listings: p.listings.map((item, itemIndex) => itemIndex === index ? { ...item, shop: event.target.value } : item) })}/></div><div className="field"><label>平台商品 ID</label><VerifiedCodeInput value={listing.productExternalId} trustedValue={originalListingValue(listing)} label="平台商品 ID" verificationEnabled={verificationEnabled('platformProductId')} onChange={value => setP({ ...p, listings: p.listings.map((item, itemIndex) => itemIndex === index ? { ...item, productExternalId: value } : item) })} onVerificationChange={verified => setFieldVerified(`listing-${listing.clientKey}`, verified)} onMismatch={setError}/></div>{listing.id ? <Toggle status={listing.status} onClick={() => setP({ ...p, listings: p.listings.map((item, itemIndex) => itemIndex === index ? { ...item, status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : item) })}/> : <button type="button" onClick={() => setP({ ...p, listings: p.listings.filter((_, itemIndex) => itemIndex !== index) })}>移除未保存项</button>}</div>)}</section>
    </div>
    <section className="card form-card" style={{ marginTop: 18 }}><h2>商品级仓配编码</h2><p className="sub">适合单规格商品；多规格商品扫码后进入商品信息。</p><div className="field" style={{ maxWidth: 520 }}><label>商品级仓配编码</label><VerifiedCodeInput value={p.cainiaoCode} trustedValue={original.current.cainiaoCode} label="商品级仓配编码" placeholder="扫描或粘贴仓配商品编码" verificationEnabled={verificationEnabled('productWarehouseCode')} onChange={value => setP({ ...p, cainiaoCode: value })} onVerificationChange={verified => setFieldVerified('product-warehouse', verified)} onMismatch={setError}/></div></section>
    <section className="card form-card" style={{ marginTop: 18 }}><div className="detail-head"><div><h2>规格与编码</h2><p className="sub">新增规格保存后自动获得下一个 yyhxfz 编码。</p></div><button type="button" className="primary" onClick={() => setP({ ...p, skus: [...p.skus, { clientKey: newKey('sku'), spec: '', barcode: '', cainiao: '', status: 'ACTIVE' }] })}>＋ 新增规格</button></div>{p.skus.map((sku, index) => <div className={`edit-sku ${sku.status === 'INACTIVE' ? 'inactive-block' : ''}`} key={sku.clientKey}><div className="field"><label>规格名称 *</label><input required value={sku.spec} onChange={event => setP({ ...p, skus: p.skus.map((item, itemIndex) => itemIndex === index ? { ...item, spec: event.target.value } : item) })}/></div><div className="field"><label>{sku.id && <LockKeyhole style={{ width: 13, verticalAlign: 'middle' }}/>} 内部编码</label><input className="locked" value={sku.internalCode || '保存后自动生成'} readOnly disabled/></div><div className="field"><label>厂家条码</label><VerifiedCodeInput value={sku.barcode} trustedValue={originalSkuValue(sku, 'barcode')} label="厂家条码" verificationEnabled={verificationEnabled('manufacturerBarcode')} onChange={value => setP({ ...p, skus: p.skus.map((item, itemIndex) => itemIndex === index ? { ...item, barcode: value } : item) })} onVerificationChange={verified => setFieldVerified(`barcode-${sku.clientKey}`, verified)} onMismatch={setError}/></div><div className="field"><label>仓配编码</label><VerifiedCodeInput value={sku.cainiao} trustedValue={originalSkuValue(sku, 'cainiao')} label="规格仓配编码" verificationEnabled={verificationEnabled('skuWarehouseCode')} onChange={value => setP({ ...p, skus: p.skus.map((item, itemIndex) => itemIndex === index ? { ...item, cainiao: value } : item) })} onVerificationChange={verified => setFieldVerified(`warehouse-${sku.clientKey}`, verified)} onMismatch={setError}/></div><div>{sku.id ? <Toggle status={sku.status} onClick={() => setP({ ...p, skus: p.skus.map((item, itemIndex) => itemIndex === index ? { ...item, status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : item) })}/> : <button type="button" onClick={() => setP({ ...p, skus: p.skus.filter((_, itemIndex) => itemIndex !== index) })}>移除未保存项</button>}</div></div>)}</section>
  </div>;
}
