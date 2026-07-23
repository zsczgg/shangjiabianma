import { PrismaClient } from '@prisma/client';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL || 'file:/data/shangjiabianma.db';
const backupDir = process.env.BACKUP_DIR || '/backups';
const interval = Number(process.env.BACKUP_INTERVAL_SECONDS || 21600) * 1000;
const retention = Number(process.env.BACKUP_RETENTION_DAYS || 30) * 86400000;

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const timestamp = () => new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const sqlPath = value => value.replaceAll("'", "''");

async function createBackup() {
  await mkdir(backupDir, { recursive: true });
  const destination = path.join(backupDir, `shangjiabianma-${timestamp()}.db`);
  const source = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    await source.$executeRawUnsafe(`VACUUM INTO '${sqlPath(destination)}'`);
  } finally {
    await source.$disconnect();
  }

  const backup = new PrismaClient({ datasources: { db: { url: `file:${destination}` } } });
  try {
    const result = await backup.$queryRawUnsafe('PRAGMA integrity_check');
    if (result?.[0]?.integrity_check !== 'ok') throw new Error('Backup integrity check failed');
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  } finally {
    await backup.$disconnect();
  }

  const now = Date.now();
  for (const file of await readdir(backupDir)) {
    if (!/^shangjiabianma-\d{14}\.db$/.test(file)) continue;
    const filePath = path.join(backupDir, file);
    if (now - (await stat(filePath)).mtimeMs > retention) await unlink(filePath);
  }
  console.log(`Backup created: ${destination}`);
}

while (true) {
  try {
    await createBackup();
  } catch (error) {
    console.error(error);
  }
  await sleep(interval);
}
