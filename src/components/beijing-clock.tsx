'use client';

import { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';
import { systemTimeZoneLabel, type SystemTimeZone } from '@/lib/system-timezone';

export default function BeijingClock({ initialTimeZone }: { initialTimeZone: SystemTimeZone }) {
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [time, setTime] = useState('');
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const update = () => setTime(formatter.format(new Date()).replaceAll('/', '-'));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [timeZone]);
  useEffect(() => {
    const handleChange = (event: Event) => setTimeZone((event as CustomEvent<SystemTimeZone>).detail);
    window.addEventListener('system-timezone-change', handleChange);
    return () => window.removeEventListener('system-timezone-change', handleChange);
  }, []);
  const label = systemTimeZoneLabel(timeZone);
  return <div className="beijing-clock" title={`系统当前使用${label}`}><IconClock/><div><small>{label}</small><time suppressHydrationWarning>{time || '正在同步…'}</time></div></div>;
}
