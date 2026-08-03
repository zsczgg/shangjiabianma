'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconCheck, IconCopy, IconKey, IconPlus, IconRefresh, IconShieldLock } from '@tabler/icons-react';

type Credential = {
  id: string;
  name: string;
  maskedKey: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type LegacyCredential = { name: string; maskedKey: string; status: 'ACTIVE' | 'INACTIVE' };

function formatTime(value: string | null) {
  if (!value) return '尚未使用';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ApiKeyManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [legacy, setLegacy] = useState<LegacyCredential | null>(null);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState(false);
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

  async function createKey() {
    if (!name.trim()) return setError('请先填写密钥名称');
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '创建失败');
      setNewKey(data.apiKey);
      setName('');
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建失败');
    } finally {
      setBusy(false);
    }
  }

  async function runAction(body: { action: 'REVOKE'; id: string } | { action: 'DISABLE_LEGACY' }) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '操作失败');
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBusy(false);
    }
  }

  async function copyNewKey() {
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="page api-key-page">
      <div className="detail-head api-key-head">
        <div>
          <span className="eyebrow">INTEGRATION ACCESS</span>
          <h1>API 管理</h1>
          <p className="sub">为进销存、库存系统或开发者分别创建访问密钥，随时停用且保留历史。</p>
        </div>
        <a className="scan-btn" href="https://github.com/zsczgg/shangjiabianma/blob/main/docs/API.md" target="_blank" rel="noreferrer">查看使用文档</a>
      </div>

      {newKey && (
        <section className="api-key-reveal" role="status">
          <div><IconShieldLock /><div><b>新密钥已创建</b><span>完整密钥只显示这一次，请立即复制并单独保存。</span></div></div>
          <code>{newKey}</code>
          <div className="api-key-reveal-actions">
            <button className="primary" type="button" onClick={() => void copyNewKey()}>{copied ? <IconCheck /> : <IconCopy />}{copied ? '已复制' : '复制完整密钥'}</button>
            <button className="quiet-button" type="button" onClick={() => setNewKey('')}>我已保存，关闭</button>
          </div>
        </section>
      )}

      <section className="card api-key-create">
        <div><IconKey /><div><h2>创建新密钥</h2><p>建议按用途命名，例如“旺店通正式环境”或“库存系统测试”。</p></div></div>
        <div className="api-key-create-form">
          <input value={name} maxLength={40} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === 'Enter' && void createKey()} placeholder="密钥名称" />
          <button className="primary" type="button" disabled={busy} onClick={() => void createKey()}><IconPlus /> 创建密钥</button>
        </div>
        {error && <div className="warning api-key-error">{error}</div>}
      </section>

      <section className="api-key-list-section">
        <div className="section-heading">
          <div><h2>访问密钥</h2><p>密钥不会删除；停用后立即失效，但记录永久保留。</p></div>
          <button className="quiet-button" type="button" onClick={() => void load()}><IconRefresh /> 刷新</button>
        </div>
        <div className="card api-key-table-wrap">
          <table className="table api-key-table">
            <thead><tr><th>名称</th><th>密钥</th><th>状态</th><th>创建时间</th><th>最近使用</th><th>操作</th></tr></thead>
            <tbody>
              {legacy && <tr><td><b>{legacy.name}</b><small>部署时生成，迁移完成后可停用</small></td><td><code>{legacy.maskedKey}</code></td><td><span className={`status-dot ${legacy.status === 'ACTIVE' ? 'active' : ''}`}>{legacy.status === 'ACTIVE' ? '使用中' : '已停用'}</span></td><td>系统部署时</td><td>不记录</td><td>{legacy.status === 'ACTIVE' ? <button className="api-key-revoke" disabled={busy} onClick={() => confirm('确认停用服务器旧密钥？请确保新密钥已经测试成功。') && void runAction({ action: 'DISABLE_LEGACY' })}>停用</button> : '—'}</td></tr>}
              {credentials.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td><code>{item.maskedKey}</code></td><td><span className={`status-dot ${item.status === 'ACTIVE' ? 'active' : ''}`}>{item.status === 'ACTIVE' ? '使用中' : '已停用'}</span></td><td>{formatTime(item.createdAt)}</td><td>{formatTime(item.lastUsedAt)}</td><td>{item.status === 'ACTIVE' ? <button className="api-key-revoke" disabled={busy} onClick={() => confirm(`确认停用“${item.name}”？停用后使用该密钥的系统会立即无法访问。`) && void runAction({ action: 'REVOKE', id: item.id })}>停用</button> : '—'}</td></tr>)}
              {!legacy && credentials.length === 0 && <tr><td colSpan={6} className="empty">还没有 API Key，请先创建一个。</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
