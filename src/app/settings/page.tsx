import ScanVerificationSettingsPanel from './scan-verification-settings-panel';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return <div className="page settings-page">
    <span className="eyebrow">SYSTEM SETTINGS</span>
    <h1>系统设置</h1>
    <p className="sub">管理新建和编辑商品时的扫码录入规则，设置会保存在数据库中。</p>
    <ScanVerificationSettingsPanel />
  </div>;
}
