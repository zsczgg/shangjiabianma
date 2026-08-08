'use client';

import { useState } from 'react';
import { IconCheck, IconClock } from '@tabler/icons-react';
import { SYSTEM_TIME_ZONE_OPTIONS, type SystemTimeZone } from '@/lib/system-timezone';

export default function SystemTimeZonePanel({ initialTimeZone }: { initialTimeZone: SystemTimeZone }) {
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save(next: SystemTimeZone) {
    setTimeZone(next);
    setStatus('saving');
    try {
      const response = await fetch('/api/system-timezone', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeZone: next }),
      });
      if (!response.ok) throw new Error();
      window.dispatchEvent(new CustomEvent('system-timezone-change', { detail: next }));
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1600);
    } catch {
      setStatus('error');
    }
  }

  return <section className="card system-settings-card timezone-settings-card">
    <div className="system-settings-head">
      <div className="system-settings-icon"><IconClock /></div>
      <div><h2>系统时区</h2><p>控制系统页面和标签打印时间的显示时区，不会改动已保存的原始数据。</p></div>
    </div>
    <div className="timezone-options">
      {SYSTEM_TIME_ZONE_OPTIONS.map(option => <button type="button" key={option.value} className={timeZone === option.value ? 'active' : ''} disabled={status === 'saving'} onClick={() => void save(option.value)}>
        <span><b>{option.label}</b><small>{option.description}</small></span>{timeZone === option.value && <IconCheck />}
      </button>)}
    </div>
    <div className={`settings-feedback ${status}`}>{status === 'saving' ? '正在保存…' : status === 'saved' ? <><IconCheck />时区已保存并立即生效</> : status === 'error' ? '保存失败，请重试' : '系统当前所有可视时间均跟随这里的设置。'}</div>
  </section>;
}
