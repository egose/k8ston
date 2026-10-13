import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { clearSessionCookie } from '@/lib/auth';
import { jsonError, jsonResponse, noStore } from '@/lib/http';

export async function GET() {
  try {
    await clearSessionCookie();
    return noStore(NextResponse.redirect(new URL('/login', config.appUrl)));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
