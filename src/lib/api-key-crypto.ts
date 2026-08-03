import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function encryptionKey(secret = process.env.API_KEY_ENCRYPTION_SECRET) {
  if (!secret || secret.length < 32) throw new Error('API_KEY_ENCRYPTION_SECRET 未配置或长度不足 32 位');
  return createHash('sha256').update(secret).digest();
}

export function encryptApiKey(value: string, secret?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptApiKey(payload: string, secret?: string) {
  const [ivValue, tagValue, encryptedValue, extra] = payload.split('.');
  if (!ivValue || !tagValue || !encryptedValue || extra) throw new Error('密钥加密数据格式无效');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}
