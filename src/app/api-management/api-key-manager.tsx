'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconCheck, IconCopy, IconEye, IconKey, IconPlus, IconRefresh, IconShieldLock, IconTrash } from '@tabler/icons-react';

type Credential = {
  id: string; name: string; maskedKey: string; status: 'ACTIVE' | 'INACTIVE';
  createdAt: string; lastUsedAt: string | null; revokedAt: string | null; revealable: boolean;
};
type LegacyCredential = { name: string; maskedKey: string; status: 'ACTIVE' | 'INACTIVE'; revealable: boolean };

function formatTime(value: string | null) {
  if (!value) return '尚未使用';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ApiKeyManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [legacy, setLegacy] = useState<LegacyCredential | null>(null);
  const [name, setName] = useState('');
  const [shownKey, setShownKey] = useState<{ value: string; title: string } | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/api-keys', { cache: 'no-store' });
    if (!response.ok) throw new Error('读取 API Key 失败');
    const data = await response.json() as { credentials: Credential[]; legacy: LegacyCredential | null };
    setCredentials(data.credentials);
    setLegacy(data.legacy);
  }, []);

  useEffect(() => { void load().catch(error => setError(error.message)); }, [load]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  }

  async function createKey() {
    if (!name.trim()) return setError('请先填写密钥名称');
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '创建失败');
      setShownKey({ value: data.apiKey, title: '新密钥已创建' });
      setName('');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : '创建失败'); }
    finally { setBusy(false); }
  }

  async function runAction(body: { action: 'REVOKE'; id: string } | { action: 'DISABLE_LEGACY' }) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/api-keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '操作失败');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }

  async function revealKey(id: string, title: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/api-keys/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '查看密钥失败');
      setShownKey({ value: data.apiKey, title });
    } catch (error) { setError(error instanceof Error ? error.message : '查看密钥失败'); }
    finally { setBusy(false); }
  }

  async function deleteKey(item: Credential) {
    if (!confirm(`确认永久删除“${item.name}”的密钥记录？该操作无法撤销。`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/api-keys/${item.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '删除失败');
      if (shownKey?.title === item.name) setShownKey(null);
      showToast('删除成功');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : '删除失败'); }
    finally { setBusy(false); }
  }

  async function copyKey() {
    if (!shownKey) return;
    let textarea: HTMLTextAreaElement | null = null;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shownKey.value);
      } else {
        textarea = document.createElement('textarea');
        textarea.value = shownKey.value;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(textarea);
        textarea.focus(); textarea.select();
        if (!document.execCommand('copy')) throw new Error('copy failed');
      }
      showToast('复制成功');
    } catch { setError('自动复制失败，请手动选中密钥复制'); }
    finally { textarea?.remove(); }
  }

  return <div className="page api-key-page">
    {toast && <div className="api-copy-toast" role="status"><IconCheck />{toast}</div>}
    <div className="detail-head api-key-head"><div><span className="eyebrow">INTEGRATION ACCESS</span><h1>API 管理</h1><p className="sub">为进销存、库存系统或开发者分别创建访问密钥。</p></div><a className="scan-btn" href="https://github.com/zsczgg/shangjiabianma/blob/main/docs/API.md" target="_blank" rel="noreferrer">查看使用文档</a></div>

    {shownKey && <section className="api-key-reveal" role="status"><div><IconShieldLock /><div><b>{shownKey.title}</b><span>完整密钥已加密保存，可随时在此页面查看。</span></div></div><code>{shownKey.value}</code><div className="api-key-reveal-actions"><button className="primary" type="button" onClick={() => void copyKey()}><IconCopy />复制完整密钥</button><button className="quiet-button" type="button" onClick={() => setShownKey(null)}>隐藏密钥</button></div></section>}

    <section className="card api-key-create"><div><IconKey /><div><h2>创建新密钥</h2><p>建议按用途命名，例如“旺店通正式环境”或“库存系统测试”。</p></div></div><div className="api-key-create-form"><input value={name} maxLength={40} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === 'Enter' && void createKey()} placeholder="密钥名称"/><button className="primary" type="button" disabled={busy} onClick={() => void createKey()}><IconPlus />创建密钥</button></div>{error && <div className="warning api-key-error">{error}</div>}</section>

    <section className="api-key-list-section"><div className="section-heading"><div><h2>访问密钥</h2><p>最后创建的排在最上面；使用中的密钥需先停用，之后才可删除。</p></div><button className="quiet-button" type="button" onClick={() => void load()}><IconRefresh />刷新</button></div><div className="card api-key-table-wrap"><table className="table api-key-table"><thead><tr><th>名称</th><th>密钥</th><th>状态</th><th>创建时间</th><th>最近使用</th><th>操作</th></tr></thead><tbody>
      {credentials.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td><code>{item.maskedKey}</code></td><td><span className={`status-dot ${item.status === 'ACTIVE' ? 'active' : ''}`}>{item.status === 'ACTIVE' ? '使用中' : '已停用'}</span></td><td>{formatTime(item.createdAt)}</td><td>{formatTime(item.lastUsedAt)}</td><td><div className="api-key-row-actions"><button type="button" disabled={busy || !item.revealable} title={item.revealable ? '查看完整密钥' : '旧密钥无法恢复'} onClick={() => void revealKey(item.id, item.name)}><IconEye />查看</button>{item.status === 'ACTIVE' ? <button className="api-key-revoke" disabled={busy} onClick={() => confirm(`确认停用“${item.name}”？停用后使用该密钥的系统会立即无法访问。`) && void runAction({ action: 'REVOKE', id: item.id })}>停用</button> : <button className="api-key-delete" disabled={busy} onClick={() => void deleteKey(item)}><IconTrash />删除</button>}</div></td></tr>)}
      {legacy && <tr><td><b>{legacy.name}</b><small>旧版服务器密钥，迁移完成后可停用</small></td><td><code>{legacy.maskedKey}</code></td><td><span className={`status-dot ${legacy.status === 'ACTIVE' ? 'active' : ''}`}>{legacy.status === 'ACTIVE' ? '使用中' : '已停用'}</span></td><td>系统部署时</td><td>不记录</td><td><div className="api-key-row-actions"><button type="button" disabled={busy} onClick={() => void revealKey('legacy', legacy.name)}><IconEye />查看</button>{legacy.status === 'ACTIVE' && <button className="api-key-revoke" disabled={busy} onClick={() => confirm('确认停用服务器旧密钥？请确保新密钥已经测试成功。') && void runAction({ action: 'DISABLE_LEGACY' })}>停用</button>}</div></td></tr>}
      {!legacy && credentials.length === 0 && <tr><td colSpan={6} className="empty">还没有 API Key，请先创建一个。</td></tr>}
    </tbody></table></div></section>
  </div>;
}
