import ApiKeyManager from './api-key-manager';
import './api-keys.css';
import { getSystemTimeZone } from '@/lib/system-timezone-store';

export const dynamic = 'force-dynamic';

export default async function ApiManagementPage() {
  const timeZone = await getSystemTimeZone();
  return <ApiKeyManager timeZone={timeZone} />;
}
