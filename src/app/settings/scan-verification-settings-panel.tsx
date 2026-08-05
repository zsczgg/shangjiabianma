'use client';

import { useEffect, useState } from 'react';
import { IconBarcode, IconCheck } from '@tabler/icons-react';
import { DEFAULT_SCAN_VERIFICATION_SETTINGS, type ScanVerificationSettings } from '@/lib/scan-verification-settings';

const fields: Array<{ key: keyof Omit<ScanVerificationSettings, 'enabled'>; title: string; description: string }> = [
  { key: 'platformProductId', title: '平台商品 ID', description: '淘宝、闲鱼、小红书和其他平台的商品 ID' },
  { key: 'productWarehouseCode', title: '商品级仓配编码', description: '适用于单规格商品的商品级仓配编码' },
  { key: 'manufacturerBarcode', title: '规格厂家条码', description: '每个规格对应的厂家原始条码' },
  { key: 'skuWarehouseCode', title: '规格仓配编码', description: '每个规格单独对应的仓配编码' },
];

export default function ScanVerificationSettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SCAN_VERIFICATION_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => {
    void fetch('/api/scan-verification-settings', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setSettings(data.settings);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function save(next: ScanVerificationSettings) {
    setSettings(next);
    setStatus('saving');
    try {
      const response = await fetch('/api/scan-verification-settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error();
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1600);
    } catch { setStatus('error'); }
  }

  return <section className="card system-settings-card">
    <div className="system-settings-head">
      <div className="system-settings-icon"><IconBarcode /></div>
      <div><h2>商品编码二次验证</h2><p>新建编码或修改已有编码时要求再次扫描，两次完全一致才允许保存。</p></div>
      <label className="switch-row master-switch"><span>{settings.enabled ? '已开启' : '已关闭'}</span><input type="checkbox" checked={settings.enabled} disabled={status === 'loading'} onChange={event => void save({ ...settings, enabled: event.target.checked })}/><i /></label>
    </div>
    <div className={`verification-setting-list ${settings.enabled ? '' : 'disabled'}`}>
      {fields.map(field => <label className="verification-setting-row" key={field.key}>
        <span><b>{field.title}</b><small>{field.description}</small></span>
        <span className="switch-row"><input type="checkbox" checked={settings[field.key]} disabled={!settings.enabled || status === 'loading'} onChange={event => void save({ ...settings, [field.key]: event.target.checked })}/><i /></span>
      </label>)}
    </div>
    <div className={`settings-feedback ${status}`}>{status === 'loading' ? '正在读取设置…' : status === 'saving' ? '正在保存…' : status === 'saved' ? <><IconCheck />设置已保存</> : status === 'error' ? '保存失败，请重试' : '设置保存在服务器数据库中，重启或更换浏览器后仍然有效。'}</div>
  </section>;
}
