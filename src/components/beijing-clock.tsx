'use client';

import { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';

const formatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

export default function BeijingClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(formatter.format(new Date()).replaceAll('/', '-'));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="beijing-clock" title="系统统一使用北京时间"><IconClock/><div><small>北京时间</small><time suppressHydrationWarning>{time || '正在同步…'}</time></div></div>;
}
