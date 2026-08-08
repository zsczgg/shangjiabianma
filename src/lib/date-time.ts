import type { SystemTimeZone } from './system-timezone';

export function formatSystemTime(value: Date | string | null | undefined, timeZone: SystemTimeZone = 'Asia/Shanghai') {
  if (!value) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(value)).replaceAll('/', '-');
}

export const formatBeijingTime = formatSystemTime;
