import { apiSuccess, API_VERSION } from '@/lib/integration-api';
import { getSystemTimeZone } from '@/lib/system-timezone-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timeZone = await getSystemTimeZone();
  return apiSuccess({ status: 'ok', version: API_VERSION, time: new Date().toISOString(), timeZone });
}
