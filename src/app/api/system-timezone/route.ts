import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SYSTEM_TIME_ZONE, SYSTEM_TIME_ZONE_SETTING_KEY, systemTimeZoneSchema } from '@/lib/system-timezone';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await prisma.appSetting.findUnique({ where: { key: SYSTEM_TIME_ZONE_SETTING_KEY } });
  const parsed = systemTimeZoneSchema.safeParse(stored?.value);
  return NextResponse.json({ timeZone: parsed.success ? parsed.data : DEFAULT_SYSTEM_TIME_ZONE, exists: parsed.success });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const timeZone = systemTimeZoneSchema.parse(body.timeZone);
    await prisma.appSetting.upsert({
      where: { key: SYSTEM_TIME_ZONE_SETTING_KEY },
      create: { key: SYSTEM_TIME_ZONE_SETTING_KEY, value: timeZone },
      update: { value: timeZone },
    });
    return NextResponse.json({ ok: true, timeZone });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '时区设置保存失败' }, { status: 400 });
  }
}
