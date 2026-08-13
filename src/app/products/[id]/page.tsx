import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Barcode from '@/components/barcode';
import { formatSystemTime } from '@/lib/date-time';
import { getSystemTimeZone } from '@/lib/system-timezone-store';

export const dynamic = 'force-dynamic';

const Status = ({ active }: { active: boolean }) => <span className={active ? 'status-active' : 'status-inactive'}>{active ? '使用中' : '已停用'}</span>;
const CodeCard = ({ label, value }: { label: string; value: string }) => <div className="code-card"><small>{label}</small><b className="code">{value}</b><Barcode value={value}/></div>;

export default async function Detail({ params }: { params: { id: string } }) {
  const [product, timeZone] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id }, include: { skus: { include: { externalCodes: true }, orderBy: { createdAt: 'asc' } }, listings: true, changes: { orderBy: { createdAt: 'desc' }, take: 30 } } }),
    getSystemTimeZone(),
  ]);
  if (!product) notFound();
  const active = product.status === 'ACTIVE';
  const firstActiveSku = product.skus.find(sku => sku.status === 'ACTIVE');
  const activeSkus = product.skus.filter(sku => sku.status === 'ACTIVE');
  const productPrintHref = activeSkus.length === 1 ? `/labels?sku=${activeSkus[0].id}` : `/labels?product=${product.id}`;

  return <div className="page">
    <div className="detail-head">
      <div className="detail-product-intro">
        {product.imageUrl && <img className="detail-product-image" src={product.imageUrl} alt={product.name}/>}<div><span className="eyebrow">PRODUCT RECORD</span><h1>{product.name}</h1><p className="sub">{product.brand || '未设置品牌'} · {product.category || '未分类'}</p></div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Status active={active}/>{active && firstActiveSku && <Link className="scan-btn" href={productPrintHref}>{activeSkus.length > 1 ? '选择标签规格' : '打印标签'}</Link>}<Link className="primary" href={`/products/${product.id}/edit`}>编辑资料</Link></div>
    </div>
    {!active && <div className="warning">该商品已停用，仅供历史追溯，请勿继续使用或出入库。</div>}
    {product.cainiaoCode && <section className="card form-card" style={{ marginBottom: 18 }}><h2>商品级仓配编码</h2><div className="code-grid"><CodeCard label="仓配编码" value={product.cainiaoCode}/></div></section>}
    <section className="card form-card"><h2>平台商品编码</h2>{product.listings.length ? <div className="code-grid">{product.listings.map(listing => <div key={listing.id} className={listing.status === 'INACTIVE' ? 'inactive-block' : ''}><CodeCard label={`${listing.channel} · ${listing.shop || '默认店铺'}${listing.status === 'INACTIVE' ? ' · 已停用' : ''}`} value={listing.productExternalId}/></div>)}</div> : <p className="sub">尚未关联平台商品 ID</p>}</section>
    <section className="card form-card" style={{ marginTop: 18 }}><h2>库存规格 · {product.skus.length}</h2><div className="spec-list">{product.skus.map(sku => <div className={`spec ${sku.status === 'INACTIVE' ? 'inactive-block' : ''}`} key={sku.id}><div style={{ gridColumn: '1/-1' }}><div className="detail-head"><div><b>{sku.spec}</b><small>{sku.status === 'INACTIVE' ? '该规格已冻结，编码永久保留' : '有效库存规格'}</small></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{sku.status === 'ACTIVE' && active && <Link className="scan-btn" href={`/labels?sku=${sku.id}`}>打印此规格</Link>}<Status active={sku.status === 'ACTIVE'}/></div></div>{sku.status === 'INACTIVE' && <div className="warning">该规格已停用，扫码仍可追溯，但禁止继续使用。</div>}<div className="code-grid" style={{ marginTop: 12 }}><CodeCard label="公司内部编码" value={sku.internalCode}/>{sku.externalCodes.map(code => <CodeCard key={code.id} label={code.type === 'CAINIAO' ? '仓配编码' : code.label || code.type} value={code.value}/>)}</div></div></div>)}</div></section>
    <section className="card form-card" style={{ marginTop: 18 }}><h2>备注</h2><p>{product.note || '暂无备注'}</p></section>
    <section className="card form-card" style={{ marginTop: 18 }}><h2>修改历史</h2>{product.changes.length ? <div className="history">{product.changes.map(change => <div className="history-row" key={change.id}><time>{formatSystemTime(change.createdAt, timeZone)}</time><b>{change.field}</b><span>{change.oldValue || '（空）'} → {change.newValue || '（空）'}</span></div>)}</div> : <p className="sub">暂时没有修改记录</p>}</section>
  </div>;
}
