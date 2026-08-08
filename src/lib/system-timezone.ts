import { z } from 'zod';

export const systemTimeZoneSchema = z.enum(['Asia/Shanghai', 'Asia/Seoul']);
export type SystemTimeZone = z.infer<typeof systemTimeZoneSchema>;

export const DEFAULT_SYSTEM_TIME_ZONE: SystemTimeZone = 'Asia/Shanghai';
export const SYSTEM_TIME_ZONE_SETTING_KEY = 'system-timezone';

export const SYSTEM_TIME_ZONE_OPTIONS: Array<{ value: SystemTimeZone; label: string; description: string }> = [
  { value: 'Asia/Shanghai', label: '北京时间', description: '中国标准时间 UTC+8' },
  { value: 'Asia/Seoul', label: '首尔时间', description: '韩国标准时间 UTC+9' },
];

export function systemTimeZoneLabel(timeZone: SystemTimeZone) {
  return SYSTEM_TIME_ZONE_OPTIONS.find(option => option.value === timeZone)?.label || '北京时间';
}
