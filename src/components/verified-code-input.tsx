'use client';

import { useEffect, useRef, useState } from 'react';
import { IconBarcode, IconCheck, IconX } from '@tabler/icons-react';

type Props = {
  value: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  verificationEnabled: boolean;
  trustedValue?: string;
  onChange: (value: string) => void;
  onVerificationChange: (verified: boolean) => void;
  onMismatch: (message: string) => void;
};

export default function VerifiedCodeInput({ value, label, placeholder, required, verificationEnabled, trustedValue, onChange, onVerificationChange, onMismatch }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [verified, setVerified] = useState(false);
  const [accepted, setAccepted] = useState(trustedValue !== undefined && value === trustedValue);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => confirmRef.current?.focus(), 30);
  }, [open]);

  function update(value: string) {
    onChange(value);
    setVerified(false);
    const matchesTrustedValue = trustedValue !== undefined && value === trustedValue;
    setAccepted(matchesTrustedValue);
    onVerificationChange(matchesTrustedValue || !verificationEnabled || !value.trim());
  }

  function requestVerification() {
    if (!verificationEnabled || !value.trim() || accepted || open) return;
    setConfirmation('');
    setOpen(true);
  }

  function clearAndClose(message?: string) {
    setOpen(false);
    setConfirmation('');
    setVerified(false);
    setAccepted(true);
    onChange('');
    onVerificationChange(true);
    if (message) onMismatch(message);
  }

  function verify() {
    if (confirmation.trim() === value.trim()) {
      setOpen(false);
      setConfirmation('');
      setVerified(true);
      setAccepted(true);
      onVerificationChange(true);
      return;
    }
    clearAndClose(`${label}前后两次扫描不一致，内容已全部清空，请重新扫描。`);
  }

  return <>
    <div className={`verified-code-control ${verified && verificationEnabled ? 'verified' : ''}`}>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        onChange={event => update(event.target.value)}
        onBlur={requestVerification}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            requestVerification();
          }
        }}
      />
      {verified && verificationEnabled && <span className="verified-code-badge"><IconCheck />已验证</span>}
    </div>
    {open && <div className="scan-verify-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && clearAndClose()}>
      <div className="scan-verify-dialog" role="dialog" aria-modal="true" aria-labelledby="scan-verify-title">
        <button type="button" className="scan-verify-close" aria-label="取消验证" onClick={() => clearAndClose()}><IconX /></button>
        <div className="scan-verify-icon"><IconBarcode /></div>
        <span className="eyebrow">SECOND SCAN</span>
        <h2 id="scan-verify-title">请再次扫描{label}</h2>
        <p>为防止扫码枪误读，请扫描同一个编码。取消或不一致都会清空原内容。</p>
        <div className="scan-verify-original"><span>第一次</span><code>{value}</code></div>
        <label>第二次扫描</label>
        <input ref={confirmRef} className="scan-verify-input" value={confirmation} onChange={event => setConfirmation(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); verify(); } }} placeholder="请用扫码枪再次扫描" autoComplete="off" />
        <button type="button" className="primary scan-verify-submit" disabled={!confirmation.trim()} onClick={verify}>确认两次一致</button>
      </div>
    </div>}
  </>;
}
