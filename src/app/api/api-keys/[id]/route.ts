import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/api-key-crypto';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id === 'legacy') {
    const apiKey = process.env.INTEGRATION_API_KEY;
    return apiKey ? NextResponse.json({ apiKey }) : NextResponse.json({ error: '旧版密钥不存在' }, { status: 404 });
  }
  const credential = await prisma.apiCredential.findUnique({ where: { id } });
  if (!credential) return NextResponse.json({ error: '密钥不存在' }, { status: 404 });
  if (!credential.encryptedKey) {
    return NextResponse.json({ error: '该密钥创建于“查看”功能上线前，只保存了不可逆哈希，无法恢复。请新建替代密钥。' }, { status: 409 });
  }
  try {
    return NextResponse.json({ apiKey: decryptApiKey(credential.encryptedKey) });
  } catch {
    return NextResponse.json({ error: '密钥解密失败，请检查服务器加密配置' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id === 'legacy') return NextResponse.json({ error: '服务器旧密钥只能停用，不能删除' }, { status: 400 });
  const credential = await prisma.apiCredential.findUnique({ where: { id } });
  if (!credential) return NextResponse.json({ error: '密钥不存在' }, { status: 404 });
  if (credential.status !== 'INACTIVE') return NextResponse.json({ error: '使用中的密钥不能删除，请先停用' }, { status: 400 });
  await prisma.apiCredential.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
