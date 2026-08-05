import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SCAN_VERIFICATION_SETTINGS, scanVerificationSettingsSchema } from '@/lib/scan-verification-settings';

const SETTING_KEY = 'new-product-scan-verification';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!stored) return NextResponse.json({ settings: DEFAULT_SCAN_VERIFICATION_SETTINGS, exists: false });
  try {
    return NextResponse.json({ settings: scanVerificationSettingsSchema.parse(JSON.parse(stored.value)), exists: true });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SCAN_VERIFICATION_SETTINGS, exists: false });
  }
}

export async function PUT(request: Request) {
  try {
    const settings = scanVerificationSettingsSchema.parse(await request.json());
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: JSON.stringify(settings) },
      update: { value: JSON.stringify(settings) },
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '设置保存失败' }, { status: 400 });
  }
}
