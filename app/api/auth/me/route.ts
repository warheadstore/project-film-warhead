import { NextResponse } from 'next/server';
import { getSessionUser, googleConfig } from '@/lib/mdflix-auth';
export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({ configured: googleConfig().ok, user: getSessionUser() }, { headers: { 'Cache-Control': 'no-store' } });
}
