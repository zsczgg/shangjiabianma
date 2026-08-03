import { apiSuccess, API_VERSION } from '@/lib/integration-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  return apiSuccess({ status: 'ok', version: API_VERSION, time: new Date().toISOString() });
}
