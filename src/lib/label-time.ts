import type { LabelSettings } from './label-settings';
import type { SystemTimeZone } from './system-timezone';

export function formatLabelPrintTime(value: Date | string, timeZone: SystemTimeZone, parts: LabelSettings['printTime']['parts']) {
  if (!Object.values(parts).some(Boolean)) return '';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, hour12: false,
    ...(parts.year ? { year: 'numeric' as const } : {}),
    ...(parts.month ? { month: '2-digit' as const } : {}),
    ...(parts.day ? { day: '2-digit' as const } : {}),
    ...(parts.hour ? { hour: '2-digit' as const } : {}),
    ...(parts.minute ? { minute: '2-digit' as const } : {}),
    ...(parts.second ? { second: '2-digit' as const } : {}),
  });
  const values = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  const date = [parts.year && values.year, parts.month && values.month, parts.day && values.day].filter(Boolean).join('-');
  const time = [parts.hour && values.hour, parts.minute && values.minute, parts.second && values.second].filter(Boolean).join(':');
  return [date, time].filter(Boolean).join(' ');
}
