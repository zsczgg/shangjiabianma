import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function Products({ searchParams }: { searchParams: { q?: string } }) {
  const products = await getCatalog(searchParams.q);
  return <div className="page">
    <span className="eyebrow">PRODUCT INFO</span>
    <h1>商品信息</h1>
    <p className="sub">列表只展示商品摘要，完整规格和编码请进入商品详情查看。</p>
    <div className="toolbar"><form style={{ flex: 1 }}><input className="search" name="q" defaultValue={searchParams.q} placeholder="搜索商品名、内部编码、厂家条码或仓配编码…"/></form><Link className="primary" href="/products/new">＋ 新建商品</Link></div>
    {products.length ? <div className="card product-summary-table-wrap"><table className="table product-summary-table">
      <thead><tr><th>商品</th><th>品牌 / 分类</th><th>规格</th><th>编码关系</th><th>平台</th><th>状态 / 更新</th><th>操作</th></tr></thead>
      <tbody>{products.map(product => {
        const activeSkus = product.skus.filter(sku => sku.status === 'ACTIVE').length;
        const externalCodes = product.skus.reduce((sum, sku) => sum + sku.externalCodes.length, 0) + (product.cainiaoCode ? 1 : 0);
        const activeListings = product.listings.filter(listing => listing.status === 'ACTIVE').length;
        return <tr key={product.id}>
          <td><Link href={`/products/${product.id}`}>{product.name}</Link><small>商品资料与全部编码</small></td>
          <td>{product.brand || '未设置品牌'}<small>{product.category || '未分类'}</small></td>
          <td><strong className="summary-number">{activeSkus}</strong><small>共 {product.skus.length} 个规格</small></td>
          <td><strong className="summary-number">{externalCodes}</strong><small>厂家/仓配等映射</small></td>
          <td><strong className="summary-number">{activeListings}</strong><small>共 {product.listings.length} 个平台关系</small></td>
          <td><span className={`status-dot ${product.status === 'ACTIVE' ? 'active' : ''}`}>{product.status === 'ACTIVE' ? '使用中' : '已停用'}</span><small>{product.updatedAt.toLocaleString('zh-CN')}</small></td>
          <td><Link className="summary-detail-link" href={`/products/${product.id}`}>查看详情</Link></td>
        </tr>;
      })}</tbody>
    </table></div> : <div className="card empty">没有找到匹配的商品</div>}
  </div>;
}
