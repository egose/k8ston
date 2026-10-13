import { getSessionUser } from '@/lib/auth';
import { jsonError, jsonResponse } from '@/lib/http';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonResponse({ user: null }, { status: 401 });
    return jsonResponse({ user });
  } catch (err) {
    return jsonError(err);
  }
}
