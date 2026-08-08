import { prisma } from './prisma';
import { DEFAULT_SYSTEM_TIME_ZONE, SYSTEM_TIME_ZONE_SETTING_KEY, systemTimeZoneSchema } from './system-timezone';

export async function getSystemTimeZone() {
  const stored = await prisma.appSetting.findUnique({ where: { key: SYSTEM_TIME_ZONE_SETTING_KEY } });
  const parsed = systemTimeZoneSchema.safeParse(stored?.value);
  return parsed.success ? parsed.data : DEFAULT_SYSTEM_TIME_ZONE;
}
