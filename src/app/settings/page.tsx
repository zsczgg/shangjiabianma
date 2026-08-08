import ScanVerificationSettingsPanel from './scan-verification-settings-panel';
import SystemTimeZonePanel from './system-timezone-panel';
import { getSystemTimeZone } from '@/lib/system-timezone-store';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const timeZone = await getSystemTimeZone();
  return <div className="page settings-page">
    <span className="eyebrow">SYSTEM SETTINGS</span>
    <h1>系统设置</h1>
    <p className="sub">管理系统时区和商品编码录入规则，设置会保存在数据库中。</p>
    <SystemTimeZonePanel initialTimeZone={timeZone} />
    <ScanVerificationSettingsPanel />
  </div>;
}
