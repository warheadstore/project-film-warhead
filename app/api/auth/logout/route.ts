import { NextResponse } from 'next/server';
import { cookieOptions, SESSION_COOKIE } from '@/lib/mdflix-auth';
export const runtime = 'nodejs';
export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
  return response;
}
