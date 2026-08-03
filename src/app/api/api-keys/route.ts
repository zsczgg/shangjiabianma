import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey, LEGACY_API_KEY_SETTING } from '@/lib/integration-api';
import { encryptApiKey } from '@/lib/api-key-crypto';

export const dynamic = 'force-dynamic';

const createSchema = z.object({ name: z.string().trim().min(1, '请填写密钥名称').max(40, '名称不能超过 40 个字') });
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('REVOKE'), id: z.string().min(1) }),
  z.object({ action: z.literal('DISABLE_LEGACY') }),
]);

function maskedLegacyKey() {
  const key = process.env.INTEGRATION_API_KEY;
  if (!key) return null;
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const [credentials, legacySetting] = await Promise.all([
    prisma.apiCredential.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.appSetting.findUnique({ where: { key: LEGACY_API_KEY_SETTING } }),
  ]);
  return NextResponse.json({
    credentials: credentials.map(item => ({
      id: item.id,
      name: item.name,
      maskedKey: `${item.keyPrefix}••••••••${item.keySuffix}`,
      status: item.status,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt,
      revokedAt: item.revokedAt,
      revealable: Boolean(item.encryptedKey),
    })),
    legacy: process.env.INTEGRATION_API_KEY ? {
      name: '服务器旧密钥',
      maskedKey: maskedLegacyKey(),
      status: legacySetting?.value === 'false' ? 'INACTIVE' : 'ACTIVE',
      revealable: true,
    } : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { name } = createSchema.parse(await request.json());
    const apiKey = generateApiKey();
    const credential = await prisma.apiCredential.create({
      data: {
        name,
        keyHash: hashApiKey(apiKey),
        keyPrefix: apiKey.slice(0, 12),
        keySuffix: apiKey.slice(-4),
        encryptedKey: encryptApiKey(apiKey),
      },
    });
    return NextResponse.json({
      credential: {
        id: credential.id,
        name: credential.name,
        maskedKey: `${credential.keyPrefix}••••••••${credential.keySuffix}`,
        status: credential.status,
        createdAt: credential.createdAt,
        lastUsedAt: null,
        revokedAt: null,
      },
      apiKey,
      warning: '完整密钥只显示这一次，请立即复制并妥善保存。',
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : '创建 API Key 失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const input = actionSchema.parse(await request.json());
    if (input.action === 'DISABLE_LEGACY') {
      const activeCount = await prisma.apiCredential.count({ where: { status: 'ACTIVE' } });
      if (activeCount === 0) {
        return NextResponse.json({ error: '请先创建并测试至少一个新密钥，再停用服务器旧密钥' }, { status: 400 });
      }
      await prisma.appSetting.upsert({
        where: { key: LEGACY_API_KEY_SETTING },
        create: { key: LEGACY_API_KEY_SETTING, value: 'false' },
        update: { value: 'false' },
      });
      return NextResponse.json({ ok: true });
    }

    const credential = await prisma.apiCredential.findUnique({ where: { id: input.id } });
    if (!credential) return NextResponse.json({ error: '密钥不存在' }, { status: 404 });
    if (credential.status !== 'INACTIVE') {
      const [activeCount, legacySetting] = await Promise.all([
        prisma.apiCredential.count({ where: { status: 'ACTIVE' } }),
        prisma.appSetting.findUnique({ where: { key: LEGACY_API_KEY_SETTING } }),
      ]);
      const legacyActive = Boolean(process.env.INTEGRATION_API_KEY) && legacySetting?.value !== 'false';
      if (activeCount <= 1 && !legacyActive) {
        return NextResponse.json({ error: '不能停用最后一个有效密钥，请先创建并测试新密钥' }, { status: 400 });
      }
      await prisma.apiCredential.update({
        where: { id: input.id },
        data: { status: 'INACTIVE', revokedAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? '请求参数不正确' : '停用 API Key 失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
